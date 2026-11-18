-- Account audience is assigned by trusted administration, never editable metadata.
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"account_mode":"demo"}'::jsonb
where email in ('citizen@weathergpt.demo','farmer@weathergpt.demo','admin@weathergpt.demo');

create function private.is_demo_account() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.users where id=(select auth.uid()) and raw_app_meta_data->>'account_mode'='demo');
$$;
revoke all on function private.is_demo_account() from public;
grant execute on function private.is_demo_account() to authenticated;

drop policy alert_read on public.alerts;
create policy alert_read on public.alerts for select to authenticated using(
  (select private.is_admin()) or
  (published and (payload->>'valid_to')::timestamptz>now() and is_demo=(select private.is_demo_account()))
);

update public.notifications n set payload=n.payload||jsonb_build_object('is_demo',a.is_demo)
from public.alerts a where n.payload->>'href'='/alerts' and n.payload->>'entity_id'=a.id::text;
drop policy notification_read on public.notifications;
create policy notification_read on public.notifications for select to authenticated using(
  user_id=(select auth.uid()) and
  (coalesce(payload->>'href','') <> '/alerts' or payload->>'is_demo'=(select private.is_demo_account())::text)
);

create or replace function private.deliver_platform_notifications() returns trigger
language plpgsql security definer set search_path='' as $$
declare event_key text;
begin
  if not private.is_admin() and coalesce(auth.jwt()->>'role','') <> 'service_role' then return new; end if;
  if tg_table_name='community_reports' then
    if tg_op='UPDATE' and new.payload->>'status' is distinct from old.payload->>'status' then
      event_key := 'report:' || new.id::text || ':' || (new.payload->>'status');
      insert into public.notifications(user_id,payload)
      values(new.user_id,jsonb_build_object('title','Your observation was reviewed','body','Status: ' || replace(new.payload->>'status','_',' ') || '. ' || coalesce(new.payload->>'reviewer_note',''),'status','unread','href','/reports','event_key',event_key,'entity_id',new.id))
      on conflict do nothing;
    end if;
  elsif tg_table_name='alerts' then
    if coalesce((new.payload->>'published')::boolean,false)
      and (new.payload->>'valid_to')::timestamptz > now()
      and (tg_op='INSERT' or not coalesce((old.payload->>'published')::boolean,false)) then
      event_key := 'alert:' || new.id::text || ':published';
      insert into public.notifications(user_id,payload)
      select distinct s.user_id,jsonb_build_object('title',case when new.is_demo then 'Demo alert: ' else 'Platform alert: ' end || (new.payload->>'title'),'body',(new.payload->>'location_name') || ' · ' || (new.payload->>'severity') || '. ' || coalesce(new.payload->>'description',''),'status','unread','href','/alerts','event_key',event_key,'entity_id',new.id,'is_demo',new.is_demo)
      from public.alert_subscriptions s join auth.users u on u.id=s.user_id
      where lower(s.payload->>'location')=lower(new.payload->>'location_name')
        and s.payload->>'in_app_enabled'='true'
        and (s.payload->'hazard_types') @> jsonb_build_array(new.payload->>'hazard_type')
        and coalesce(u.raw_app_meta_data->>'account_mode'='demo',false)=new.is_demo
      on conflict do nothing;
    end if;
  end if;
  return new;
end $$;
revoke all on function private.deliver_platform_notifications() from public,anon,authenticated;
