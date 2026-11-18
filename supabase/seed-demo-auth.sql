-- Dedicated demonstration projects ONLY. Run as database owner after migrations.
-- For normal installations prefer scripts/seed-demo-users.ts (Auth Admin API).
-- These published credentials must never coexist with real personal data.
do $$
declare persona text; uid uuid; demo_email text; demo_password text;
begin
  foreach persona in array array['citizen','farmer','admin'] loop
    demo_email := persona || '@weathergpt.demo';
    demo_password := initcap(persona) || '@12345';
    select id into uid from auth.users where email=demo_email;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
      values('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',demo_email,extensions.crypt(demo_password,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}',jsonb_build_object('display_name',initcap(persona),'persona',case when persona='farmer' then 'farmer' else 'citizen' end),now(),now(),'','','','');
      insert into auth.identities(provider_id,user_id,identity_data,provider,created_at,updated_at)
      values(uid::text,uid,jsonb_build_object('sub',uid::text,'email',demo_email,'email_verified',true),'email',now(),now());
    end if;
    insert into public.user_roles(user_id,role) values(uid,case when persona='admin' then 'admin' else 'citizen' end) on conflict do nothing;
    if not exists(select 1 from public.saved_locations where user_id=uid) then
      insert into public.saved_locations(user_id,payload) values(uid,'{"id":"delhi","name":"New Delhi","state":"Delhi","country":"India","latitude":28.6139,"longitude":77.209,"timezone":"Asia/Kolkata"}');
      insert into public.notifications(user_id,payload) values(uid,'{"title":"Welcome to WeatherGPT Bharat","body":"Ask a sourced weather question or explore your dashboard.","status":"unread"}');
    end if;
    if persona='farmer' and not exists(select 1 from public.farms where user_id=uid) then
      insert into public.farms(user_id,payload) values(uid,'{"name":"Yamuna Farm","crop":"Tomato","crop_stage":"Flowering","area_hectares":2}');
    end if;
  end loop;
end $$;

update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"account_mode":"demo"}'::jsonb where email in ('citizen@weathergpt.demo','farmer@weathergpt.demo','admin@weathergpt.demo');
