"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api, useApp, useOnline } from "@/components/providers";
import type { AlertFeed } from "@/lib/alerts";

export function useAlertFeed() {
  const { user, location, lowBandwidth } = useApp();
  return useQuery({
    queryKey:["alert-feed",user.id,location.latitude,location.longitude],
    queryFn:()=>api<AlertFeed>("/api/alerts",location),
    staleTime:55000,
    refetchInterval:lowBandwidth?300000:60000,
    refetchIntervalInBackground:false,
    refetchOnReconnect:true,
    refetchOnWindowFocus:true,
  });
}

export function AlertMonitor() {
  const {user} = useApp();
  const feed = useAlertFeed();
  const online = useOnline();
  const router = useRouter();
  useEffect(()=>{
    if (!online || !feed.data || feed.isError) return;
    const key = `wg-alert-seen:${user.id}`;
    let seen:string[]=[];
    try { const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))seen=value.filter(x=>typeof x==='string'); } catch { /* Ignore corrupt device data. */ }
    const now = Date.now();
    const fresh = feed.data.alerts.filter(a=>feed.data!.notificationIds.includes(a.id) && Date.parse(a.valid_to)>now && Date.parse(a.valid_from)<=now && !seen.includes(a.id));
    if (!fresh.length) return;
    const first = fresh[0];
    toast(first.is_demo?'Demo weather alert':'New forecast alert',{description:`${first.location_name}: ${first.title}${fresh.length>1?` (+${fresh.length-1} more)`:''}`,action:{label:'View alerts',onClick:()=>router.push('/alerts')}});
    try {localStorage.setItem(key,JSON.stringify([...new Set([...seen,...fresh.map(a=>a.id)])].slice(-500)));} catch { /* Live cards still work when device storage is unavailable. */ }
  },[feed.data,feed.isError,online,user.id,router]);
  return null;
}
