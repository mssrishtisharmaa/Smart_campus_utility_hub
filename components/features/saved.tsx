"use client";
import { useState } from "react";
import { MapPin, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRecords } from "@/components/records";
import { useApp } from "@/components/providers";
import { LocationSearch } from "@/components/location-search";
import { Empty, Badge } from "@/components/ui";
import type { Place } from "@/types";
export function SavedPage() {
  const records = useRecords("saved_locations");
  const { setLocation } = useApp();
  const [selected, setSelected] = useState<Place>();
  const router = useRouter();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE PLACES THAT MATTER TO YOU</p>
          <h1>Your saved locations</h1>
          <p>Home, your farm, or your next destination. Keep them close.</p>
        </div>
      </div>
      <div className="card content-card" style={{ marginBottom: 24 }}>
        <LocationSearch onSelect={setSelected} />
        {selected && (
          <div className="record-actions">
            <span className="text-link">
              <MapPin size={16} />
              {selected.name}, {selected.state}
            </span>
            <button
              className="btn"
              onClick={() => {
                if (records.data?.some((r) => r.payload.id === selected.id)) {
                  toast.info("This location is already saved.");
                  return;
                }
                records.save.mutate(
                  { payload: { ...selected } },
                  {
                    onSuccess: () => {
                      toast.success(`${selected.name} saved.`);
                      setSelected(undefined);
                    },
                  },
                );
              }}
            >
              <Plus size={16} /> Save location
            </button>
          </div>
        )}
      </div>
      <div className="content-grid">
        {records.data?.map((r) => (
          <div className="card record-card" key={r.id}>
            <MapPin size={23} />
            <div>
              <h3>{String(r.payload.name)}</h3>
              <p>{String(r.payload.state)}</p>
              <div className="record-meta">
                <Badge tone="teal">Saved to your account</Badge>
              </div>
              <div className="record-actions">
                <button
                  className="btn secondary"
                  onClick={() => {
                    setLocation(r.payload as unknown as Place);
                    router.push("/dashboard");
                  }}
                >
                  View forecast <ArrowRight size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove ${r.payload.name}`}
                  onClick={() => {
                    if (
                      confirm(`Remove ${r.payload.name} from saved locations?`)
                    )
                      records.remove.mutate(r.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {records.data?.length === 0 && (
        <Empty
          title="Where would you like to keep an eye on the weather?"
          description="Search for a place and confirm with Save location. Your places will be here the next time you sign in."
        />
      )}
    </>
  );
}
