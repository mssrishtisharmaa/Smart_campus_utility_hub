import {describe,it,expect,vi,afterEach} from 'vitest';
import {demoAlerts,forecastAlerts,isDemoAccount} from '@/lib/alerts';
import {DemoWeatherProvider} from '@/lib/weather/provider';
import {places} from '@/lib/locations';
import type {User} from '@/types';

const now=Date.parse('2026-09-27T06:15:00Z');
async function weather(){vi.useFakeTimers();vi.setSystemTime(now);const w=await new DemoWeatherProvider().getWeather(places[0]);w.isDemo=false;w.state='live';w.provider='Open-Meteo';w.current.apparent=28;w.current.visibility=10000;w.current.time=new Date(now).toISOString();w.hourly=Array.from({length:24},(_,i)=>({time:new Date(Math.floor(now/3600000)*3600000+i*3600000).toISOString(),temperature:28,rainProbability:0,precipitation:0,wind:10,code:0}));return w;}
afterEach(()=>vi.useRealTimers());
describe('Demo and personal weather alerts',()=>{
  it('identifies demos by trusted account flag, not email or persona',()=>{const user={mode:'supabase',email:'citizen@weathergpt.demo',persona:'farmer'} as User;expect(isDemoAccount(user)).toBe(false);expect(isDemoAccount({...user,demoAccount:true})).toBe(true);});
  it('demo scenarios are explicit, stable per interval, and rotate',()=>{const a=demoAlerts(places[0],now),b=demoAlerts(places[0],now+60000),c=demoAlerts(places[0],now+900000);expect(a).toEqual(b);expect(a[0].id).not.toBe(c[0].id);expect(a.every(x=>x.is_demo&&x.description.includes('does not describe current weather'))).toBe(true);});
  it('does not invent alerts when current conditions miss thresholds',async()=>{expect(forecastAlerts(await weather(),now)).toEqual([]);});
  it('real thresholds emit sourced non-demo advisories with valid windows',async()=>{const w=await weather();w.current.apparent=40;w.current.visibility=500;w.hourly[2].wind=45;w.hourly[3].code=95;w.hourly.forEach(h=>h.precipitation=2);const alerts=forecastAlerts(w,now);expect(alerts).toHaveLength(5);expect(alerts.every(a=>!a.is_demo&&a.origin==='derived'&&a.description.includes('not an official warning')&&Date.parse(a.valid_to)>now)).toBe(true);expect(alerts.find(a=>a.hazard_type==='Strong wind')?.valid_from).toBe(w.hourly[2].time);});
  it('rejects synthetic, stale and out-of-date data',async()=>{const w=await weather();w.current.apparent=45;for(const unsafe of [{...w,isDemo:true},{...w,state:'stale' as const},{...w,retrievedAt:new Date(now-660000).toISOString()}])expect(forecastAlerts(unsafe,now)).toEqual([]);});
  it('does not create current hazards from an old model-valid time',async()=>{const w=await weather();w.current.apparent=45;w.current.time=new Date(now-7200000).toISOString();expect(forecastAlerts(w,now)).toEqual([]);});
  it('ignores past wind and storms and incomplete 24-hour rainfall',async()=>{const w=await weather();w.hourly[0].time=new Date(now-7200000).toISOString();w.hourly[0].code=95;w.hourly[0].wind=80;w.hourly.forEach(h=>h.precipitation=10);expect(forecastAlerts(w,now)).toEqual([]);});
});
