"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useSyncExternalStore,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toaster, toast } from "sonner";
import type { Place, Weather, Risk, User } from "@/types";
import { places } from "@/lib/locations";
import { browserClient } from "@/lib/supabase/client";
export async function api<T>(
  url: string,
  body?: unknown,
  method?: string,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(url, {
    method: method || (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed. Please retry.");
  return data;
}
type Context = {
  location: Place;
  setLocation: (v: Place) => void;
  user: User;
  unit: string;
  setUnit: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  lowBandwidth: boolean;
  setLowBandwidth: (v: boolean) => void;
  syncStatus: 'connecting' | 'connected' | 'error' | 'local';
};
const AppContext = createContext<Context | null>(null);
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
export function AppProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [location, setLoc] = useState<Place>(places[0]);
  const [unit, setU] = useState(String(user.preferences?.temperature_unit||'c'));
  const [language, setL] = useState(String(user.preferences?.language||'en'));
  const [lowBandwidth, setB] = useState(Boolean(user.preferences?.low_bandwidth));
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Context['syncStatus']>(user.mode === 'supabase' ? 'connecting' : 'local');
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast',Boolean(user.preferences?.high_contrast));
    document.documentElement.classList.toggle('reduced-motion',Boolean(user.preferences?.reduced_motion));
    const restore = () => { const stored = localStorage.getItem("wg-preferences");
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (p.location) setLoc(p.location);
        if (p.unit) setU(p.unit);
        if (p.language) setL(p.language);
        setB(Boolean(p.lowBandwidth));
      } catch {
        /* Ignore corrupt device preferences. */
      }
    }
    setPreferencesReady(true); };
    const timer = window.setTimeout(restore, 0);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => window.clearTimeout(timer);
  }, [user.preferences?.high_contrast, user.preferences?.reduced_motion]);
  useEffect(() => {
    if (!preferencesReady) return;
    localStorage.setItem(
      "wg-preferences",
      JSON.stringify({ location, unit, language, lowBandwidth }),
    );
    document.documentElement.lang = language;
    document.documentElement.dataset.lowBandwidth = String(lowBandwidth);
  }, [location, unit, language, lowBandwidth, preferencesReady]);
  useEffect(() => {
    if (user.mode !== "supabase") return;
    const client = browserClient();
    let active = true;
    const channel = client
      .channel(`updates-${user.id}-${crypto.randomUUID()}`,{config:{broadcast:{replication_ready:true}}})
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (event) => {if(event.eventType==='INSERT')toast.info(String(event.new.payload?.title || 'You have a new notification.'),{action:{label:'View',onClick:()=>{router.push('/notifications');}}});void queryClient.invalidateQueries({queryKey:['records','notifications']});},
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {void queryClient.invalidateQueries({queryKey:['records','alerts']});void queryClient.invalidateQueries({queryKey:['alert-feed']});void queryClient.invalidateQueries({queryKey:['admin']});},
      )
      .on('postgres_changes',{event:'*',schema:'public',table:'community_reports'},()=>{void queryClient.invalidateQueries({queryKey:['admin']});void queryClient.invalidateQueries({queryKey:['community-map']});void queryClient.invalidateQueries({queryKey:['records','community_reports']});});
    for(const table of ['saved_locations','farms','alert_subscriptions','user_preferences','conversations','generated_advisories']) channel.on('postgres_changes',{event:'*',schema:'public',table,filter:`user_id=eq.${user.id}`},()=>{void queryClient.invalidateQueries({queryKey:['records',table]});if(table==='saved_locations'||table==='alert_subscriptions')void queryClient.invalidateQueries({queryKey:['alert-feed']});});
    channel.on('system',{},event=>{if(!active)return;if(event.status==='ok'){setSyncStatus('connected');void queryClient.invalidateQueries({queryKey:['records']});}else setSyncStatus('error');});
    void (async()=>{
      const {data}=await client.auth.getSession();
      if(!active)return;
      if(!data.session){setSyncStatus('error');return;}
      await client.realtime.setAuth(data.session.access_token);
      if(active)channel.subscribe(status=>{if(active&&status!=='SUBSCRIBED')setSyncStatus(status==='CHANNEL_ERROR'||status==='TIMED_OUT'?'error':'connecting');});
    })().catch(()=>{if(active)setSyncStatus('error');});
    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [user.id, user.mode, queryClient, router]);
  return (
    <AppContext.Provider
      value={{
        location,
        setLocation: setLoc,
        user,
        unit,
        setUnit: setU,
        language,
        setLanguage: setL,
        lowBandwidth,
        setLowBandwidth: setB,
        syncStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export const useApp = () => {
  const c = useContext(AppContext);
  if (!c) throw new Error("App context missing");
  return c;
};
export function useWeather() {
  const { location, lowBandwidth } = useApp();
  return useQuery({
    queryKey: ["weather", location.latitude, location.longitude],
    queryFn: async () => {
      try {const result=await api<{weather:Weather;risk:Risk}>("/api/weather",location);localStorage.setItem('wg-last-weather',JSON.stringify(result));return result;}
      catch(error){if(!navigator.onLine){try{const cached=JSON.parse(localStorage.getItem('wg-last-weather')||'null') as {weather:Weather;risk:Risk}|null;if(cached&&cached.weather.location.latitude===location.latitude&&cached.weather.location.longitude===location.longitude)return {...cached,weather:{...cached.weather,state:'stale' as const,error:'Offline. Showing your last saved forecast; this is not current weather.'},risk:{...cached.risk,confidence:'Low' as const,reasons:['Offline cached forecast.']}};}catch{/* Invalid device cache: show the original error. */}}throw error;}
    },
    staleTime: 55000,
    refetchInterval: lowBandwidth ? 300000 : 60000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
export function useOnline() {
  return useSyncExternalStore(subscribeOnline,()=>navigator.onLine,()=>true);
}
function subscribeOnline(notify:()=>void){window.addEventListener('online',notify);window.addEventListener('offline',notify);return()=>{window.removeEventListener('online',notify);window.removeEventListener('offline',notify);};}
export function useClock(){const[now,setNow]=useState(()=>Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);return now;}


