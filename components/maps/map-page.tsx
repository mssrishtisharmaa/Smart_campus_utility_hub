"use client";
import dynamic from "next/dynamic";
import { Loading } from "@/components/ui";
const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: Loading,
});
export function MapPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A DIFFERENT VIEW OF YOUR WEATHER</p>
          <h1>Explore the weather map.</h1>
          <p>
            Inspect your location, saved places, and account-specific alert points.
          </p>
        </div>
      </div>
      <MapView />
    </>
  );
}
