-- Transactional, idempotent in-app delivery; no client can execute this helper.
create unique index notifications_delivery_unique on public.notifications(user_id,(payload->>'event_key')) where payload ? 'event_key';
create function private.deliver_platform_notifications() returns trigger
language plpgsql security definer set search_path='' as $$
declare event_key text;
begin
  if not private.is_admin() and coalesce(auth.role(),'') <> 'service_role' then return new; end if;
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
      select distinct s.user_id,jsonb_build_object('title',case when coalesce((new.payload->>'is_demo')::boolean,true) then 'Demo alert: ' else 'Platform alert: ' end || (new.payload->>'title'),'body',(new.payload->>'location_name') || ' · ' || (new.payload->>'severity') || '. ' || coalesce(new.payload->>'description',''),'status','unread','href','/alerts','event_key',event_key,'entity_id',new.id)
      from public.alert_subscriptions s
      where lower(s.payload->>'location')=lower(new.payload->>'location_name')
        and s.payload->>'in_app_enabled'='true'
        and (s.payload->'hazard_types') @> jsonb_build_array(new.payload->>'hazard_type')
      on conflict do nothing;
    end if;
  end if;
  return new;
end $$;
revoke all on function private.deliver_platform_notifications() from public,anon,authenticated;
create trigger notify_report_review after update on public.community_reports for each row execute function private.deliver_platform_notifications();
create trigger notify_alert_publication after insert or update on public.alerts for each row execute function private.deliver_platform_notifications();

-- Realtime authorizes each subscriber through the existing ownership policies.
do $$
declare table_name text;
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach table_name in array array['saved_locations','farms','alert_subscriptions','user_preferences','conversations','generated_advisories'] loop
      if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
        execute format('alter publication supabase_realtime add table public.%I',table_name);
      end if;
    end loop;
  end if;
end $$;

