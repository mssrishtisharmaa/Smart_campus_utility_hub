import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
let db:PGlite;
const demo='41111111-1111-4111-8111-111111111111',personal='42222222-2222-4222-8222-222222222222';
async function asUser(id:string,sql:string){await db.exec(`reset role;select set_config('request.jwt.claim.sub','${id}',false);select set_config('request.jwt.claim.role','authenticated',false);set role authenticated;`);try{return await db.query(sql);}finally{await db.exec('reset role;');}}
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}',raw_app_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
    create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('role',current_setting('request.jwt.claim.role',true))$$;
    grant usage on schema auth to anon,authenticated;grant execute on all functions in schema auth to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;grant usage on schema storage to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  await db.exec(`insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values('${demo}','demo@example.invalid','{"account_mode":"demo"}','{}'),('${personal}','personal@example.invalid','{}','{"account_mode":"demo","role":"admin"}');
    insert into public.alert_subscriptions(user_id,payload) values('${demo}','{"location":"Delhi","hazard_types":["Heavy rain"],"in_app_enabled":true}'),('${personal}','{"location":"Delhi","hazard_types":["Heavy rain"],"in_app_enabled":true}');
    select set_config('request.jwt.claim.role','service_role',false);
    insert into public.alerts(payload) select jsonb_build_object('title',case when sample then 'Demo fixture' else 'Real source fixture' end,'severity','Advisory','origin','derived','hazard_type','Heavy rain','location_name','Delhi','is_demo',sample,'published',true,'valid_to',(now()+interval '1 hour')::text) from (values(true),(false)) t(sample);`);
},60000);
afterAll(async()=>{await db?.close();});
describe('Cloud alert audience policies and transactional delivery',()=>{
  it('demo reads only demonstration rows',async()=>{const result=await asUser(demo,'select title,is_demo from public.alerts');expect(result.rows).toEqual([{title:'Demo fixture',is_demo:true}]);});
  it('personal users cannot see demos despite spoofed editable metadata',async()=>{const result=await asUser(personal,'select title,is_demo from public.alerts');expect(result.rows).toEqual([{title:'Real source fixture',is_demo:false}]);});
  it('publication delivers only to matching account audiences',async()=>{const d=await asUser(demo,"select payload->>'is_demo' as demo from public.notifications");const p=await asUser(personal,"select payload->>'is_demo' as demo from public.notifications");expect(d.rows).toEqual([{demo:'true'}]);expect(p.rows).toEqual([{demo:'false'}]);});
  it('normal users cannot change trusted audience or forge notifications',async()=>{await expect(asUser(personal,`update auth.users set raw_app_meta_data='{"account_mode":"demo"}' where id='${personal}'`)).rejects.toThrow();await expect(asUser(personal,`insert into public.notifications(user_id,payload) values('${personal}','{}')`)).rejects.toThrow();});
  it('anonymous clients cannot retrieve the demonstration feed',async()=>{await db.exec('set role anon;');try{expect((await db.query('select id from public.alerts')).rows).toEqual([]);}finally{await db.exec('reset role;');}});
});
