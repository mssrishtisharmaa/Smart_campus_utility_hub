"use client";
import { useState } from "react";
import { Search, MapPin, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { api } from "./providers";
import { places } from "@/lib/locations";
import type { Place } from "@/types";
export function LocationSearch({
  onSelect,
  compact = false,
}: {
  onSelect: (p: Place) => void;
  compact?: boolean;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.length < 2) return;
    setBusy(true);
    try {
      const r = await api<Place[]>(`/api/locations?q=${encodeURIComponent(q)}`);
      setResults(r);
      if (!r.length) toast.info("No matching places. Try a nearby city.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported. Search for your city.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onSelect({
          id: `device-${p.coords.latitude.toFixed(3)}`,
          name: "My location",
          state: "Device location",
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setResults([]);
      },
      () =>
        toast.error(
          "Location access was denied or unavailable. Search for your city instead.",
        ),
      { timeout: 10000 },
    );
  }
  return (
    <div className={`location-search ${compact ? "compact" : ""}`}>
      <form onSubmit={search}>
        <Search size={18} />
        <input
          aria-label="Search city"
          placeholder="Search any city or district…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          minLength={2}
        />
        <button className="btn small" disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </button>
        <button
          title="Use my location"
          aria-label="Use my location"
          type="button"
          className="icon-button"
          onClick={locate}
        >
          <LocateFixed size={18} />
        </button>
      </form>
      {!compact && (
        <div className="city-chips">
          {places.slice(0, 4).map((p) => (
            <button key={p.id} onClick={() => onSelect(p)}>
              {p.name}
            </button>
          ))}
        </div>
      )}
      {results.length > 0 && (
        <div className="search-results">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onSelect(p);
                setResults([]);
                setQ("");
              }}
            >
              <MapPin size={16} />
              {p.name}
              <span>{p.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
