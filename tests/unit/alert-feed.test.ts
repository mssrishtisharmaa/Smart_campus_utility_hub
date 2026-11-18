import {describe,it,expect,vi,beforeEach} from 'vitest';
import type {User} from '@/types';
import {places} from '@/lib/locations';
const mocks=vi.hoisted(()=>({records:vi.fn(),weather:vi.fn()}));
vi.mock('@/lib/repository',()=>({listRecords:mocks.records}));
vi.mock('@/lib/weather/provider',()=>({getWeather:mocks.weather}));
import {buildAlertFeed} from '@/lib/alert-feed';
const personal={id:'personal',mode:'supabase',demoAccount:false} as User;
beforeEach(()=>{vi.resetAllMocks();mocks.records.mockResolvedValue([]);});
describe('Account-specific alert feed',()=>{
  it('personal fresh data generates real advisories and respects popup interests',async()=>{
    const now=Date.now();mocks.weather.mockResolvedValue({location:places[0],provider:'Open-Meteo',isDemo:false,state:'live',retrievedAt:new Date(now).toISOString(),current:{time:new Date(now).toISOString(),apparent:40,visibility:10000},hourly:[{time:new Date(Math.floor(now/3600000)*3600000).toISOString(),wind:5,precipitation:0,code:0}]});
    let feed=await buildAlertFeed(personal,places[0]);expect(feed.alerts).toHaveLength(1);expect(feed.alerts[0]).toMatchObject({is_demo:false,source_name:'Open-Meteo',hazard_type:'Heat wave'});expect(feed.notificationIds).toHaveLength(1);
    mocks.records.mockImplementation(async(_:unknown,kind:string)=>kind==='alert_subscriptions'?[{payload:{location:places[0].name,in_app_enabled:true,hazard_types:[]}}]:[]);
    feed=await buildAlertFeed(personal,places[0]);expect(feed.alerts).toHaveLength(1);expect(feed.notificationIds).toEqual([]);
  });
  it('demo feed uses only simulation and never requests real data',async()=>{const feed=await buildAlertFeed({...personal,demoAccount:true},places[0]);expect(feed.audience).toBe('demo');expect(feed.alerts.length).toBeGreaterThan(0);expect(feed.alerts.every(a=>a.is_demo)).toBe(true);expect(mocks.weather).not.toHaveBeenCalled();});
  it('personal feed never falls back to demos during an outage',async()=>{mocks.weather.mockRejectedValue(new Error('offline'));const feed=await buildAlertFeed(personal,places[0]);expect(feed.audience).toBe('personal');expect(feed.alerts).toEqual([]);expect(feed.checks[0].state).toBe('unavailable');});
  it('filters stored alerts by audience even if an admin can read both',async()=>{mocks.records.mockImplementation(async(_:unknown,kind:string)=>kind==='alerts'?[{id:'synthetic',payload:{is_demo:true,published:true,valid_to:new Date(Date.now()+60000).toISOString(),latitude:places[0].latitude,longitude:places[0].longitude}}]:[]);mocks.weather.mockRejectedValue(new Error('offline'));expect((await buildAlertFeed(personal,places[0])).alerts).toEqual([]);});
  it('checks selected and saved coordinates once with bounded provider requests',async()=>{mocks.records.mockImplementation(async(_:unknown,kind:string)=>kind==='saved_locations'?places.slice(0,7).map(p=>({payload:p})):[]);mocks.weather.mockRejectedValue(new Error('offline'));const feed=await buildAlertFeed(personal,places[0]);expect(mocks.weather).toHaveBeenCalledTimes(5);expect(feed.omittedLocations).toBe(2);});
});
