-- WeatherGPT Bharat. Apply only to a dedicated development project first.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Weather explorer', preferred_language text not null default 'en',
 persona text not null default 'citizen' check (persona in ('citizen','farmer','disaster_manager','researcher')),
 avatar_path text, onboarding_completed boolean not null default false, low_bandwidth_mode boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (user_id uuid not null references auth.users(id) on delete cascade, role text not null check(role in ('citizen','admin')), primary key(user_id,role));
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin');
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated,anon;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
grant select on public.profiles,public.user_roles to authenticated;
grant update(display_name,preferred_language,persona,avatar_path,onboarding_completed,low_bandwidth_mode,updated_at) on public.profiles to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=(select auth.uid()) or (select private.is_admin()));
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy role_read on public.user_roles for select to authenticated using(user_id=(select auth.uid()) or (select private.is_admin()));
create function private.bootstrap_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_schema <> 'auth' or tg_table_name <> 'users' then raise exception 'Invalid trigger source'; end if;
 if auth.uid() is not null and auth.uid() <> new.id then raise exception 'Invalid user context'; end if;
 insert into public.profiles(id,display_name,persona) values(new.id,coalesce(left(new.raw_user_meta_data->>'display_name',80),'Weather explorer'),case when new.raw_user_meta_data->>'persona' in ('citizen','farmer','disaster_manager','researcher') then new.raw_user_meta_data->>'persona' else 'citizen' end);
 insert into public.user_roles(user_id,role) values(new.id,'citizen');
 return new;
end $$;
revoke all on function private.bootstrap_profile() from public,anon,authenticated;
create trigger bootstrap_weather_profile after insert on auth.users for each row execute function private.bootstrap_profile();
create function private.updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end $$;
revoke all on function private.updated_at() from public;
create trigger profile_updated before update on public.profiles for each row execute function private.updated_at();
create table public.locations(id uuid primary key default gen_random_uuid(), name text not null, district text, state text, country text not null default 'IN', latitude double precision not null check(latitude between -90 and 90),longitude double precision not null check(longitude between -180 and 180),timezone text not null default 'Asia/Kolkata',created_at timestamptz not null default now(),unique(name,latitude,longitude));
alter table public.locations enable row level security;grant select on public.locations to anon,authenticated;
create policy locations_read on public.locations for select to anon,authenticated using(true);

create table public.saved_locations(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.saved_locations enable row level security;
create index saved_locations_owner_idx on public.saved_locations(user_id);
create index saved_locations_created_idx on public.saved_locations(created_at desc);
create trigger saved_locations_updated before update on public.saved_locations for each row execute function private.updated_at();

create table public.farms(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.farms enable row level security;
create index farms_owner_idx on public.farms(user_id);
create index farms_created_idx on public.farms(created_at desc);
create trigger farms_updated before update on public.farms for each row execute function private.updated_at();

create table public.alert_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.alert_subscriptions enable row level security;
create index alert_subscriptions_owner_idx on public.alert_subscriptions(user_id);
create index alert_subscriptions_created_idx on public.alert_subscriptions(created_at desc);
create trigger alert_subscriptions_updated before update on public.alert_subscriptions for each row execute function private.updated_at();

create table public.conversations(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.conversations enable row level security;
create index conversations_owner_idx on public.conversations(user_id);
create index conversations_created_idx on public.conversations(created_at desc);
create trigger conversations_updated before update on public.conversations for each row execute function private.updated_at();

create table public.generated_advisories(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.generated_advisories enable row level security;
create index generated_advisories_owner_idx on public.generated_advisories(user_id);
create index generated_advisories_created_idx on public.generated_advisories(created_at desc);
create trigger generated_advisories_updated before update on public.generated_advisories for each row execute function private.updated_at();

create table public.feedback(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.feedback enable row level security;
create index feedback_owner_idx on public.feedback(user_id);
create index feedback_created_idx on public.feedback(created_at desc);
create trigger feedback_updated before update on public.feedback for each row execute function private.updated_at();

create table public.user_preferences(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.user_preferences enable row level security;
create index user_preferences_owner_idx on public.user_preferences(user_id);
create index user_preferences_created_idx on public.user_preferences(created_at desc);
create trigger user_preferences_updated before update on public.user_preferences for each row execute function private.updated_at();

create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.notifications enable row level security;
create index notifications_owner_idx on public.notifications(user_id);
create index notifications_created_idx on public.notifications(created_at desc);
create trigger notifications_updated before update on public.notifications for each row execute function private.updated_at();

create table public.community_reports(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.community_reports enable row level security;
create index community_reports_owner_idx on public.community_reports(user_id);
create index community_reports_created_idx on public.community_reports(created_at desc);
create trigger community_reports_updated before update on public.community_reports for each row execute function private.updated_at();

create table public.alerts(id uuid primary key default gen_random_uuid(),user_id uuid  references auth.users(id) on delete cascade,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.alerts enable row level security;
create index alerts_owner_idx on public.alerts(user_id);
create index alerts_created_idx on public.alerts(created_at desc);
create trigger alerts_updated before update on public.alerts for each row execute function private.updated_at();

create table public.audit_logs(id uuid primary key default gen_random_uuid(),user_id uuid  references auth.users(id) on delete set null,payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.audit_logs enable row level security;
create index audit_logs_owner_idx on public.audit_logs(user_id);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create trigger audit_logs_updated before update on public.audit_logs for each row execute function private.updated_at();
grant select,insert,update,delete on public.saved_locations to authenticated;
create policy saved_locations_select on public.saved_locations for select to authenticated using(user_id=(select auth.uid()) );
create policy saved_locations_insert on public.saved_locations for insert to authenticated with check(user_id=(select auth.uid()));
create policy saved_locations_update on public.saved_locations for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy saved_locations_delete on public.saved_locations for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.farms to authenticated;
create policy farms_select on public.farms for select to authenticated using(user_id=(select auth.uid()) );
create policy farms_insert on public.farms for insert to authenticated with check(user_id=(select auth.uid()));
create policy farms_update on public.farms for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy farms_delete on public.farms for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.alert_subscriptions to authenticated;
create policy alert_subscriptions_select on public.alert_subscriptions for select to authenticated using(user_id=(select auth.uid()) );
create policy alert_subscriptions_insert on public.alert_subscriptions for insert to authenticated with check(user_id=(select auth.uid()));
create policy alert_subscriptions_update on public.alert_subscriptions for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy alert_subscriptions_delete on public.alert_subscriptions for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.conversations to authenticated;
create policy conversations_select on public.conversations for select to authenticated using(user_id=(select auth.uid()));
create policy conversations_insert on public.conversations for insert to authenticated with check(user_id=(select auth.uid()));
create policy conversations_update on public.conversations for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy conversations_delete on public.conversations for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.generated_advisories to authenticated;
create policy generated_advisories_select on public.generated_advisories for select to authenticated using(user_id=(select auth.uid()) );
create policy generated_advisories_insert on public.generated_advisories for insert to authenticated with check(user_id=(select auth.uid()));
create policy generated_advisories_update on public.generated_advisories for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy generated_advisories_delete on public.generated_advisories for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.feedback to authenticated;
create policy feedback_select on public.feedback for select to authenticated using(user_id=(select auth.uid()) );
create policy feedback_insert on public.feedback for insert to authenticated with check(user_id=(select auth.uid()));
create policy feedback_update on public.feedback for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy feedback_delete on public.feedback for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.user_preferences to authenticated;
create policy user_preferences_select on public.user_preferences for select to authenticated using(user_id=(select auth.uid()) );
create policy user_preferences_insert on public.user_preferences for insert to authenticated with check(user_id=(select auth.uid()));
create policy user_preferences_update on public.user_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy user_preferences_delete on public.user_preferences for delete to authenticated using(user_id=(select auth.uid()));

create unique index saved_location_unique on public.saved_locations(user_id,(payload->>'id'));
create unique index user_preferences_unique on public.user_preferences(user_id);
alter table public.farms add column location_id uuid references public.locations(id),add column name text generated always as (payload->>'name') stored,add column crop text generated always as (payload->>'crop') stored,add column crop_stage text generated always as (payload->>'crop_stage') stored;
alter table public.saved_locations add column location_id uuid references public.locations(id),add column label text generated always as (payload->>'label') stored;
alter table public.alert_subscriptions add column location_id uuid references public.locations(id);
alter table public.alerts add column title text generated always as (payload->>'title') stored,add column severity text generated always as(payload->>'severity') stored check(severity in ('Advisory','Watch','Alert','Warning','Emergency')),add column origin text generated always as(payload->>'origin') stored check(origin in ('official','derived','community')),add column published boolean generated always as(coalesce((payload->>'published')::boolean,false)) stored,add column is_demo boolean generated always as(coalesce((payload->>'is_demo')::boolean,false)) stored;
alter table public.community_reports add column status text generated always as(coalesce(payload->>'status','submitted')) stored check(status in ('submitted','under_review','verified','rejected','duplicate')),add column public_display boolean generated always as(coalesce((payload->>'public_display')::boolean,false)) stored;
alter table public.notifications add column status text generated always as(coalesce(payload->>'status','unread')) stored check(status in ('unread','read'));
grant select,insert,update on public.community_reports to authenticated;
grant select on public.community_reports to anon;
create policy report_select on public.community_reports for select to anon,authenticated using((status='verified' and public_display) or user_id=(select auth.uid()) or (select private.is_admin()));
create policy report_insert on public.community_reports for insert to authenticated with check(user_id=(select auth.uid()) and status='submitted' and (payload->>'consent')::boolean=true);
create policy report_review on public.community_reports for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
grant select on public.alerts to anon,authenticated;
grant insert,update on public.alerts to authenticated;
create policy alert_read on public.alerts for select to anon,authenticated using((published and (payload->>'valid_to')::timestamptz>now()) or (select private.is_admin()));
create policy alert_create on public.alerts for insert to authenticated with check((select private.is_admin()) and is_demo and origin='derived');
create policy alert_update on public.alerts for update to authenticated using((select private.is_admin())) with check((select private.is_admin()) and is_demo and origin='derived');
grant select,update on public.notifications to authenticated;
create policy notification_read on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notification_update on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select on public.audit_logs to authenticated;
create policy audit_read on public.audit_logs for select to authenticated using((select private.is_admin()));
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then return new;end if;
 if not private.is_admin() then
  if tg_table_name='community_reports' and tg_op='INSERT' and new.user_id=auth.uid() then return new;end if;
  raise exception 'Administrator role required for audit event';
 end if;
 insert into public.audit_logs(user_id,payload) values(auth.uid(),jsonb_build_object('actor',auth.uid(),'action',tg_op,'entity',tg_table_name,'entity_id',new.id,'before',case when tg_op='UPDATE' then old.payload else null end,'after',new.payload));return new;
end $$;
revoke all on function private.audit_change() from public,anon,authenticated;
create trigger audit_alert after insert or update on public.alerts for each row execute function private.audit_change();
create trigger audit_report after insert or update on public.community_reports for each row execute function private.audit_change();
create table public.messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.conversations(id) on delete cascade,role text not null check(role in ('user','assistant','system')),content text not null,structured_payload jsonb,model_name text,created_at timestamptz not null default now());
create table public.message_sources(id uuid primary key default gen_random_uuid(),message_id uuid not null references public.messages(id) on delete cascade,source_name text not null,source_url text,retrieved_at timestamptz,issued_at timestamptz,data_hash text,metadata jsonb not null default '{}');
alter table public.messages enable row level security;alter table public.message_sources enable row level security;
grant select,insert,update,delete on public.messages,public.message_sources to authenticated;
create index messages_conversation_idx on public.messages(conversation_id);create index sources_message_idx on public.message_sources(message_id);
create policy message_owner on public.messages for all to authenticated using(exists(select 1 from public.conversations c where c.id=conversation_id and c.user_id=(select auth.uid()))) with check(exists(select 1 from public.conversations c where c.id=conversation_id and c.user_id=(select auth.uid())));
create policy sources_owner on public.message_sources for all to authenticated using(exists(select 1 from public.messages m join public.conversations c on c.id=m.conversation_id where m.id=message_id and c.user_id=(select auth.uid()))) with check(exists(select 1 from public.messages m join public.conversations c on c.id=m.conversation_id where m.id=message_id and c.user_id=(select auth.uid())));
create function private.sync_messages() returns trigger language plpgsql security invoker set search_path='' as $$
declare item jsonb; mid uuid;
begin
 delete from public.messages where conversation_id=new.id;
 for item in select value from jsonb_array_elements(coalesce(new.payload->'messages','[]')) loop
  insert into public.messages(conversation_id,role,content,structured_payload) values(new.id,item->>'role',item->>'content',item->'response') returning id into mid;
  if item->'response'->'evidence' is not null then
   insert into public.message_sources(message_id,source_name,source_url,retrieved_at,data_hash,metadata) values(mid,item->'response'->'evidence'->>'source',item->'response'->'evidence'->>'sourceUrl',(item->'response'->'evidence'->>'retrievedAt')::timestamptz,item->'response'->'evidence'->>'hash',item->'response'->'evidence');
  end if;
 end loop;
 return new;
end $$;
revoke all on function private.sync_messages() from public;
create trigger conversation_messages after insert or update of payload on public.conversations for each row execute function private.sync_messages();
create table public.weather_snapshots(id uuid primary key default gen_random_uuid(),location_id uuid references public.locations(id),provider text,payload jsonb not null default '{}',is_demo boolean not null default true,created_at timestamptz not null default now());alter table public.weather_snapshots enable row level security;grant select on public.weather_snapshots to anon,authenticated;create policy weather_snapshots_read on public.weather_snapshots for select to anon,authenticated using(true);create index weather_snapshots_date on public.weather_snapshots(created_at desc);
create table public.advisory_rules(id uuid primary key default gen_random_uuid(),location_id uuid references public.locations(id),provider text,payload jsonb not null default '{}',is_demo boolean not null default true,created_at timestamptz not null default now());alter table public.advisory_rules enable row level security;grant select on public.advisory_rules to anon,authenticated;create policy advisory_rules_read on public.advisory_rules for select to anon,authenticated using(true);create index advisory_rules_date on public.advisory_rules(created_at desc);
create table public.provider_health(id uuid primary key default gen_random_uuid(),location_id uuid references public.locations(id),provider text,payload jsonb not null default '{}',is_demo boolean not null default true,created_at timestamptz not null default now());alter table public.provider_health enable row level security;grant select on public.provider_health to anon,authenticated;create policy provider_health_read on public.provider_health for select to anon,authenticated using(true);create index provider_health_date on public.provider_health(created_at desc);
create table public.climate_series(id uuid primary key default gen_random_uuid(),location_id uuid references public.locations(id),provider text,payload jsonb not null default '{}',is_demo boolean not null default true,created_at timestamptz not null default now());alter table public.climate_series enable row level security;grant select on public.climate_series to anon,authenticated;create policy climate_series_read on public.climate_series for select to anon,authenticated using(true);create index climate_series_date on public.climate_series(created_at desc);
alter table public.climate_series add column date date, add column metric text,add column value double precision,add column unit text;create unique index climate_point_unique on public.climate_series(location_id,date,metric,provider);
-- Service role remains server-only and may seed or ingest. No normal role can write serving data.
grant all on all tables in schema public to service_role;
-- Private report image bucket. Storage API handles object ownership; no public bucket access.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('report-images','report-images',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy report_image_insert on storage.objects for insert to authenticated with check(bucket_id='report-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy report_image_select on storage.objects for select to authenticated using(bucket_id='report-images' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_admin())));
create policy report_image_delete on storage.objects for delete to authenticated using(bucket_id='report-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- No upsert is used; uploads use fresh UUID paths. Realtime never modifies its internal schema.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.alerts,public.notifications,public.community_reports;
 end if;
end $$;
