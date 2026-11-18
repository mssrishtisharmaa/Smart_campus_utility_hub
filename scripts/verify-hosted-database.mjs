import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const clients=[];const checks=[];const created=[];
async function account(role){const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});clients.push(c);const r=await c.auth.signInWithPassword({email:`${role}@weathergpt.demo`,password:`${role[0].toUpperCase()+role.slice(1)}@12345`});assert.equal(r.error,null);return{c,id:r.data.user.id};}
try{
const citizen=await account('citizen'),farmer=await account('farmer'),admin=await account('admin');checks.push('All three hosted demo accounts authenticate');
const saved=await citizen.c.from('saved_locations').insert({user_id:citizen.id,payload:{name:'RLS verification fixture'}}).select('id').single();assert.equal(saved.error,null);created.push([citizen.c,'saved_locations',saved.data.id]);
const hidden=await farmer.c.from('saved_locations').select('id').eq('id',saved.data.id);assert.equal(hidden.error,null);assert.deepEqual(hidden.data,[]);checks.push('Cross-account saved location read denied');
const overwritten=await farmer.c.from('saved_locations').update({payload:{name:'forbidden'}}).eq('id',saved.data.id).select('id');assert.deepEqual(overwritten.data,[]);checks.push('Cross-account update denied');
const escalation=await citizen.c.from('user_roles').insert({user_id:citizen.id,role:'admin'});assert.ok(escalation.error);checks.push('Citizen cannot grant administrator role');
const impersonation=await citizen.c.from('saved_locations').insert({user_id:farmer.id,payload:{name:'forbidden'}});assert.ok(impersonation.error);checks.push('Owner impersonation denied');
const conv=await citizen.c.from('conversations').insert({user_id:citizen.id,payload:{title:'Hosted verification',messages:[{role:'assistant',content:'A verified test fixture.'}]}}).select('id').single();assert.equal(conv.error,null);created.push([citizen.c,'conversations',conv.data.id]);
const messages=await citizen.c.from('messages').select('id').eq('conversation_id',conv.data.id);assert.equal(messages.error,null);assert.equal(messages.data.length,1);const adminRead=await admin.c.from('conversations').select('id').eq('id',conv.data.id);assert.deepEqual(adminRead.data,[]);checks.push('Messages materialize and conversations remain private from administrators');
const notify=await citizen.c.from('notifications').insert({user_id:citizen.id,payload:{title:'forbidden'}});assert.ok(notify.error);checks.push('User cannot impersonate trusted notification system');
const audit=await citizen.c.from('audit_logs').select('id');assert.equal(audit.error,null);assert.deepEqual(audit.data,[]);checks.push('Audit trail inaccessible to citizen');
const output={verifiedAt:new Date().toISOString(),project:process.env.NEXT_PUBLIC_SUPABASE_URL,checks};await writeFile('docs/hosted-database-verification.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
}finally{for(const[c,table,id]of created)await c.from(table).delete().eq('id',id);for(const c of clients)await c.auth.signOut();}
