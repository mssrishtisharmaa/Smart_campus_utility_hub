"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize, Layers, LocateFixed, Wind, Droplets, ArrowUpRight, MapPin, RefreshCw } from "lucide-react";
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApp, useWeather, api, useClock } from "@/components/providers";
import { useRecords } from "@/components/records";
import { useAlertFeed } from "@/components/alert-feed";
import { Badge, SourceBadge } from "@/components/ui";
import { condition, temperature } from '@/lib/locations';
import type { Place } from "@/types";
type PublicReport={id:string;latitude:number;longitude:number;type:string;description:string};
export default function MapView() {
  const { location, setLocation, unit, lowBandwidth } = useApp();
  const now = useClock();
  const { data, refetch, isFetching } = useWeather();
  const alerts = useAlertFeed();
  const saved = useRecords("saved_locations");
  const reports = useQuery({queryKey:['community-map'],queryFn:()=>api<PublicReport[]>('/api/community-map'),refetchInterval:60000,refetchOnReconnect:true});
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [layer, setLayer] = useState("Temperature");
  useEffect(() => {
    if (!container.current) return;
    const m = L.map(container.current, {
      center: [location.latitude, location.longitude],
      zoom: 7,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(m);
    map.current = m;
    const resize = new ResizeObserver(()=>m.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, [location.latitude, location.longitude]);
  useEffect(() => {
    if (!map.current) return;
    const group = L.layerGroup().addTo(map.current);
    const w = data?.weather;
    const popup = (title: string, body: string) => {
      const div = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = title;
      const p = document.createElement("p");
      p.textContent = body;
      div.append(strong, p);
      return div;
    };
    const metric =
      layer === "Temperature"
        ? `${w ? temperature(w.current.temperature,unit) : "—"} °${unit.toUpperCase()}`
        : layer === "Precipitation"
          ? `${w?.hourly[0]?.rainProbability ?? "—"}% rain probability`
          : layer === "Wind"
            ? `${w?.current.wind ?? "—"} km/h`
            : "Selected location";
    L.circleMarker([location.latitude, location.longitude], {
      radius: 14,
      color: "#fff",
      weight: 3,
      fillColor:
        layer === "Precipitation"
          ? "#499ad0"
          : layer === "Wind"
            ? "#63a58d"
            : "#d29954",
      fillOpacity: 1,
    })
      .addTo(group)
      .bindPopup(
        popup(
          location.name,
          `${metric} · ${w?.state || "Loading"} · ${w?.provider || ""}`,
        ),
      )
      .openPopup();
    if (["Temperature", "Precipitation", "Wind"].includes(layer))
      for (const r of saved.data || []) {
        const lat = Number(r.payload.latitude),
          lon = Number(r.payload.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lon) && (lat!==location.latitude||lon!==location.longitude))
          L.circleMarker([lat, lon], {
            radius: 7,
            color: "#5b8ca5",
            fillOpacity: 0.6,
          })
            .addTo(group)
            .bindPopup(
              popup(
                String(r.payload.name),
                "Saved place. Select this location in the header to retrieve its forecast.",
              ),
            );
      }
    if (layer === "Alerts")
      for (const a of alerts.data?.alerts || []) {
        if (!a.published || Date.parse(a.valid_to) < Date.now()) continue;
        L.circleMarker([a.latitude, a.longitude], {
          radius: 20,
          color: "#cd8c48",
          fillColor: "#eeb979",
          fillOpacity: 0.25,
          weight: 2,
        })
          .addTo(group)
          .bindPopup(
            popup(
              a.title,
              `${a.location_name} · ${a.is_demo ? "Demo scenario" : "Forecast advisory"} at this point. Not an official warning area.`,
            ),
          );
      }
    if (layer === "Community reports")
      for (const r of reports.data || []) {
        const lat = Number(r.latitude),
          lon = Number(r.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lon))
          L.circleMarker([lat, lon], { radius: 9, color: "#7869a6" })
            .addTo(group)
            .bindPopup(
              popup(String(r.type), String(r.description)),
            );
      }
    return () => {
      group.remove();
    };
  }, [data, location, layer, alerts.data, saved.data, reports.data, unit]);
  return (
    <>
      <div className="map-toolbar toolbar">
        <Layers size={17} />
        <select
          aria-label="Map layer"
          value={layer}
          onChange={(e) => setLayer(e.target.value)}
        >
          {[
            "Temperature",
            "Precipitation",
            "Wind",
            "Alerts",
            "Community reports",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <Badge tone="blue">Sourced point forecasts</Badge>
        <button className="btn secondary small" onClick={()=>map.current?.setView([location.latitude,location.longitude],7)}><LocateFixed size={15}/> Recenter</button>
        <button
          className="btn secondary"
          onClick={async () => {
            try {if(!container.current?.requestFullscreen)throw new Error();await container.current.requestFullscreen();} catch {toast.info('Full screen is unavailable in this browser. You can still pan and zoom the map.');}
          }}
        >
          <Maximize size={15} /> Full screen
        </button>
      </div>
      <div className="map-workspace">
      <div className="map-container">
        <div ref={container} style={{ height: "100%" }} />
      </div>
      <aside className="map-detail card" aria-label="Selected location weather">
        <p className="eyebrow">YOUR SELECTED LOCATION</p>
        <h2><MapPin size={17}/>{location.name}</h2>
        <p className="muted">{location.state} · {location.latitude.toFixed(2)}° N, {location.longitude.toFixed(2)}° E</p>
        <div className="map-temperature">{data ? temperature(data.weather.current.temperature,unit) : '—'}<span>°{unit.toUpperCase()}</span></div>
        <p>{data ? condition(data.weather.current.code) : 'Retrieving forecast…'}</p>
        <div className="map-metrics"><div><Droplets size={16}/><span>Rain chance</span><strong>{data?.weather.hourly[0]?.rainProbability ?? '—'}%</strong></div><div><Wind size={16}/><span>Wind</span><strong>{data?.weather.current.wind ?? '—'} km/h</strong></div></div>
        {data ? <SourceBadge weather={data.weather}/> : null}
        <div className="map-refresh"><span>Auto-refresh · {lowBandwidth ? '5 min' : '60 sec'}</span><button className="icon-button" aria-label="Refresh map forecast" disabled={isFetching} onClick={()=>void refetch()}><RefreshCw size={15} className={isFetching?'spin':''}/></button></div>
        <Link className="btn wide" href="/chat">Ask about this location <ArrowUpRight size={16}/></Link>
        {(saved.data?.length ?? 0)>0 ? <div className="map-saved"><p className="eyebrow">QUICK LOCATIONS</p>{saved.data?.slice(0,6).map(r=><button key={r.id} className={r.payload.name===location.name?'active':''} onClick={()=>setLocation(r.payload as unknown as Place)}>{String(r.payload.name)}<ArrowUpRight size={13}/></button>)}</div>:<Link href="/saved-locations" className="text-link">Add saved locations <ArrowUpRight size={15}/></Link>}
      </aside>
      </div>
      {layer==='Alerts'&&!alerts.data?.alerts.some(a=>a.published&&Date.parse(a.valid_to)>now)?<div className="notice">No current forecast alerts are available in this feed. Check official IMD channels for warnings.</div>:null}
      {layer==='Community reports'&&reports.data?.length===0?<div className="notice">No verified public observations yet. Approved reports with public-display consent will appear here automatically.</div>:null}
      {reports.error&&layer==='Community reports'?<div className="notice">Community reports could not be loaded. <button className="text-link" onClick={()=>void reports.refetch()}>Retry</button></div>:null}
      <div className="map-legend">
        <span>
          <i style={{ background: "#d29954" }} />
          Selected forecast point
        </span>
        <span>
          <i style={{ background: "#5b8ca5" }} />
          Saved location
        </span>
        <span>
          <i style={{ background: "#eeb979" }} />
          Alert forecast point
        </span>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Click a point or area to inspect it. Weather layers show the selected
        location’s forecast, not a continuous raster. Community reports appear
        only when verified, public, and geolocated.
      </p>
    </>
  );
}

