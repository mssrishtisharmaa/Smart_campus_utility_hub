import { z } from "zod";
import { route, apiUser, ApiError } from "@/lib/security";
import { placeSchema } from "@/lib/validation";
import { DemoClimateProvider } from "@/lib/weather/provider";
import {historicalYear} from '@/lib/weather/history';
export async function POST(req: Request) {
  return route(async () => {
    await apiUser(req);
    const { location, year, mode } = z
      .object({
        location: placeSchema,
        year: z.number().int().min(2000).max(2025),
        mode:z.enum(['demo','reanalysis']).default('demo'),
      })
      .parse(await req.json());
    if(mode==='reanalysis'){
      try{const[current,reference]=await Promise.all([historicalYear(location,year),historicalYear(location,2020)]);return{points:current.points.map((p,i)=>({...p,baseline:reference.points[i].temperature})),source:'ERA5 reanalysis via Open-Meteo',coverage:`${current.covered}/${current.total} daily records`,baseline:'2020 comparison year (not a climate normal)',isDemo:false,retrievedAt:new Date().toISOString()};}catch{throw new ApiError(502,'Historical data is unavailable or incomplete. Retry, or explicitly select Demonstration series.');}
    }
    return {
      points: await new DemoClimateProvider().getClimateSeries(location, year),
      source: "Synthetic historical demonstration series",
      coverage: "12 of 12 synthetic months",
      baseline: "Synthetic 2020 reference",
      isDemo: true,
    };
  });
}
