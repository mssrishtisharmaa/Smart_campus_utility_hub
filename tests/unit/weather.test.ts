import {describe,it,expect,vi,afterEach} from 'vitest';
import {calculateRisk,actionWindows,compareForecast} from '@/lib/risk/engine';
import {DemoWeatherProvider,OpenMeteoProvider} from '@/lib/weather/provider';
import {places,temperature,timeLabel} from '@/lib/locations';
import {placeSchema,reportSchema} from '@/lib/validation';
describe('Weather decision safety',()=>{
 afterEach(()=>vi.restoreAllMocks());
 it('never gives real-decision confidence to demo data',async()=>{const w=await new DemoWeatherProvider().getWeather(places[0]);expect(calculateRisk(w).confidence).toBe('Low');});
 it('flags heat, heavy rain and poor visibility without inventing official severity',async()=>{const w=await new DemoWeatherProvider().getWeather(places[0]);w.current.apparent=42;w.current.visibility=200;w.hourly[0].precipitation=40;const risk=calculateRisk(w);expect(risk.hazards).toContain('Heat stress');expect(risk.hazards).toContain('Heavy rainfall');expect(risk.hazards).toContain('Poor visibility');expect(risk.level).toBe('Alert');});
 it('rejects rain-and-wind spray windows and avoids overlapping alternatives',async()=>{const w=await new DemoWeatherProvider().getWeather(places[0]);w.hourly.forEach(h=>{h.wind=25;h.rainProbability=80;});const windows=actionWindows(w.hourly.slice(0,12));expect(windows.every(w=>w.status==='Avoid')).toBe(true);for(let i=0;i<windows.length;i++)for(let j=i+1;j<windows.length;j++)expect(new Date(windows[i].end)<=new Date(windows[j].start)||new Date(windows[j].end)<=new Date(windows[i].start)).toBe(true);});
 it('does not recommend an incomplete or discontinuous window',async()=>{const w=await new DemoWeatherProvider().getWeather(places[0]);expect(actionWindows(w.hourly.slice(0,2))).toEqual([]);expect(actionWindows([w.hourly[0],w.hourly[2],w.hourly[4]])).toEqual([]);});
 it('compares the same valid forecast hour',async()=>{const old=await new DemoWeatherProvider().getWeather(places[0]);const next=structuredClone(old);next.hourly[0].rainProbability+=20;expect(compareForecast(old,next)[0].change).toBe(20);});
 it('converts units and formats Indian half-hour timezone correctly',()=>{expect(temperature(0,'f')).toBe(32);expect(temperature(100,'f')).toBe(212);expect(timeLabel('2025-01-01T00:00:00Z')).toMatch(/5:30/);});
 it('rejects invalid coordinates and missing reporting consent',()=>{expect(placeSchema.safeParse({...places[0],latitude:100}).success).toBe(false);expect(reportSchema.safeParse({type:'Rain',description:'A valid description',location:'Delhi',observed_at:new Date().toISOString(),severity:'Minor',consent:false,public_display:true,status:'submitted'}).success).toBe(false);});
 it('rejects malformed provider weather instead of presenting it',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({current:{temperature_2m:'invented'}})}));await expect(new OpenMeteoProvider().getWeather(places[0])).rejects.toThrow();vi.unstubAllGlobals();});
});
