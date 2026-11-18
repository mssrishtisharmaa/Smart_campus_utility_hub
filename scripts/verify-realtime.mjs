import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const citizen=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const received=[];let channel,subscription,alert;
const check=r=>{if(r.error)throw new Error(r.error.message);return r.data;};
async function waitEvent(id){const deadline=Date.now()+15000;while(Date.now()<deadline){if(received.some(r=>r.entity_id===id))return;await new Promise(r=>setTimeout(r,150));}throw new Error('Expected websocket notification did not arrive within 15 seconds.');}
try{
  const user=check(await citizen.auth.signInWithPassword({email:'citizen@weathergpt.demo',password:'Citizen@12345'})).user;
  check(await admin.auth.signInWithPassword({email:'admin@weathergpt.demo',password:'Admin@12345'}));
  channel=citizen.channel(`verification-${randomUUID()}`,{config:{broadcast:{replication_ready:true}}}).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${user.id}`},event=>received.push(event.new.payload));
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Websocket subscription timed out')),15000);channel.on('system',{},p=>{if(p.status==='ok'){clearTimeout(timer);resolve();}if(p.status==='error'){clearTimeout(timer);reject(new Error('Replication connection failed: '+p.message));}}).subscribe(s=>{if(s==='CHANNEL_ERROR'){clearTimeout(timer);reject(new Error('Websocket channel failed'));}});});
  const report=check(await citizen.from('community_reports').insert({user_id:user.id,payload:{type:'Verification fixture',description:'Automated realtime verification. Not an actual weather event.',location:'New Delhi',observed_at:new Date().toISOString(),status:'submitted',consent:true,public_display:false}}).select('id,payload').single());
  check(await admin.from('community_reports').update({payload:{...report.payload,status:'verified',reviewer_note:'Automated demonstration check.'}}).eq('id',report.id));
  await waitEvent(report.id);
  subscription=check(await citizen.from('alert_subscriptions').insert({user_id:user.id,payload:{location:'Verification Location',hazard_types:['Heavy rain'],in_app_enabled:true}}).select('id').single());
  alert=check(await admin.from('alerts').insert({payload:{title:'Realtime verification fixture',description:'Automated demonstration only. Not a weather warning.',location_name:'Verification Location',severity:'Advisory',hazard_type:'Heavy rain',origin:'derived',is_demo:true,published:false,valid_to:new Date(Date.now()+600000).toISOString()}}).select('id,payload').single());
  check(await admin.from('alerts').update({payload:{...alert.payload,published:true}}).eq('id',alert.id));await waitEvent(alert.id);
  check(await admin.from('alerts').update({payload:{...alert.payload,published:true}}).eq('id',alert.id));
  const deliveries=check(await citizen.from('notifications').select('id').eq('payload->>event_key',`alert:${alert.id}:published`));assert.equal(deliveries.length,1);
  const result={verifiedAt:new Date().toISOString(),checks:['Authenticated realtime websocket subscribes','Report review creates a private notification delivered over websocket','Matching alert subscription receives a publication notification over websocket','Repeated alert update does not duplicate delivery']};await writeFile('docs/realtime-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{
  if(subscription)await citizen.from('alert_subscriptions').delete().eq('id',subscription.id);
  if(alert)await admin.from('alerts').update({payload:{...alert.payload,published:false,valid_to:new Date().toISOString()}}).eq('id',alert.id);
  if(channel)await citizen.removeChannel(channel);await citizen.auth.signOut();await admin.auth.signOut();citizen.realtime.disconnect();admin.realtime.disconnect();
}


