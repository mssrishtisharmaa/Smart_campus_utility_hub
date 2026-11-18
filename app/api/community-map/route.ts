import { apiUser, route } from '@/lib/security';
import { serverClient } from '@/lib/supabase/server';
import { db } from '@/lib/local-db';
import type { RecordItem } from '@/types';
export async function GET(req:Request){return route(async()=>{
  const user=await apiUser(req);
  let rows:Pick<RecordItem,'id'|'payload'>[];
  if(user.mode==='supabase'){
    const {data,error}=await (await serverClient()).from('community_reports').select('id,payload').eq('status','verified').eq('public_display',true).order('created_at',{ascending:false}).limit(200);
    if(error)throw error;rows=data;
  }else rows=db().prepare("SELECT id,payload FROM records WHERE kind='community_reports' ORDER BY created_at DESC LIMIT 200").all().map(r=>({id:String(r.id),payload:JSON.parse(String(r.payload))}));
  return rows.filter(r=>r.payload.status==='verified'&&r.payload.public_display===true).map(r=>({id:r.id,type:r.payload.type,description:r.payload.description,location:r.payload.location,latitude:r.payload.latitude,longitude:r.payload.longitude,observed_at:r.payload.observed_at}));
});}
