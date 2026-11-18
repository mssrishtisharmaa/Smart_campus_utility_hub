"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Download, Info } from "lucide-react";
import { api, useApp } from "@/components/providers";
import { Badge, Loading, ErrorState } from "@/components/ui";
type Point = {
  month: string;
  temperature: number;
  rainfall: number;
  baseline: number;
  extremeDays: number;
  isDemo: boolean;
};
export function ClimatePage() {
  const { location } = useApp();
  const [year, setYear] = useState(2025);
  const [mode,setMode] = useState('reanalysis');
  const { data, isPending, error } = useQuery({
    queryKey: ["climate", location.id, year,mode],
    queryFn: () =>
      api<{
        points: Point[];
        source: string;
        coverage: string;
        baseline: string;
        isDemo:boolean;
      }>("/api/climate", { location, year,mode }),
  });
  function download() {
    if (!data) return;
    const csv =
      "month,temperature_c,rainfall_mm,comparison_2020_c,days_max_40c,is_demo\n" +
      data.points
        .map((p) =>
          [
            p.month,
            p.temperature,
            p.rainfall,
            p.baseline,
            p.extremeDays,
            p.isDemo,
          ].join(","),
        )
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mode}-climate-${location.id}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">LOOK BEYOND THE DAILY FORECAST</p>
          <h1>Climate, in perspective.</h1>
          <p>Explore historical weather and a comparison year for {location.name}.</p>
        </div>
        <button className="btn secondary" onClick={download} disabled={!data}>
          <Download size={17} /> Download CSV
        </button>
      </div>
      <div className="notice amber">
        <Info size={18} /> {mode==='demo'?'Synthetic demonstration data; no real-world climate claims can be inferred.':'ERA5 reanalysis is a model-based reconstruction, not a local station observation. A single comparison year is not a climate normal or trend.'}
      </div>
      <div className="toolbar">
        <select aria-label="Historical source" value={mode} onChange={e=>setMode(e.target.value)}><option value="reanalysis">ERA5 reanalysis · public API</option><option value="demo">Demonstration series</option></select>
        <label htmlFor="climate-year">Period</label>
        <select
          id="climate-year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[2025, 2024, 2023, 2022, 2021].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <Badge tone={mode==='demo'?'amber':'teal'}>{mode==='demo'?'Demo climate series':'Historical reanalysis request'}</Badge>
      </div>
      {isPending ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error?.message || "No climate data available."} />
      ) : (
        <>
          <div className="metric-grid">
            {[
              [
                "Average temperature",
                `${(data.points.reduce((s, p) => s + p.temperature, 0) / 12).toFixed(1)}°C`,
                data.isDemo?'Synthetic monthly mean':'Mean of monthly reanalysis means',
              ],
              [
                "Annual rainfall",
                `${data.points.reduce((s, p) => s + p.rainfall, 0)} mm`,
                data.isDemo?'Sum of synthetic months':'Total reanalysis precipitation',
              ],
              [
                "Comparison-year difference",
                `${(data.points.reduce((s, p) => s + p.temperature - p.baseline, 0) / 12).toFixed(1)}°C`,
                data.baseline,
              ],
              [
                "Data coverage",
                "12 / 12",
                data.coverage,
              ],
            ].map(([label, value, note]) => (
              <div className="card metric-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
          <div className="content-grid">
            <div className="card content-card">
              <h2>Monthly temperature & comparison year</h2>
              <div
                role="img"
                aria-label="Monthly temperature and comparison year. Values and source are provided in the table below."
              >
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={data.points} margin={{ left: -25 }}>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area
                      dataKey="temperature"
                      fill="#dff0f7"
                      stroke="#3289aa"
                    />
                    <Line
                      dataKey="baseline"
                      stroke="#e8ac5d"
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card content-card">
              <h2>Monthly rainfall</h2>
              <div
                role="img"
                aria-label="Monthly rainfall in millimetres. Values and source are provided in the table below."
              >
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.points} margin={{ left: -25 }}>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar
                      dataKey="rainfall"
                      fill="#74aabb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="card content-card" style={{ marginTop: 22 }}>
            <h2>Read the data</h2>
            <div className="source-line"><Badge tone={data.isDemo?'amber':'teal'}>{data.isDemo?'Demo data':'Retrieved reanalysis'}</Badge><span>{data.source} · {data.coverage}</span></div>
            <p>
              This view compares one year with 2020. It does not establish statistical significance or a climate trend. Long-term climate analysis requires quality control and a defined multi-decade reference period. A seven-day forecast is not climate data.
            </p>
            <details>
              <summary className="text-link">
                View accessible data table
              </summary>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Temperature °C</th>
                      <th>Rainfall mm</th>
                      <th>2020 comparison °C</th>
                      <th>Days with max ≥40°C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.points.map((p) => (
                      <tr key={p.month}>
                        <td>{p.month}</td>
                        <td>{p.temperature}</td>
                        <td>{p.rainfall}</td>
                        <td>{p.baseline}</td>
                        <td>{p.extremeDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </>
      )}
    </>
  );
}
