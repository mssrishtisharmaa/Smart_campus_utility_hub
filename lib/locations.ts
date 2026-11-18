import type { Place } from "@/types";
export const places: Place[] = [
  ["new-delhi", "New Delhi", "Delhi", 28.6139, 77.209],
  ["mumbai", "Mumbai", "Maharashtra", 19.076, 72.8777],
  ["chennai", "Chennai", "Tamil Nadu", 13.0827, 80.2707],
  ["kolkata", "Kolkata", "West Bengal", 22.5726, 88.3639],
  ["bengaluru", "Bengaluru", "Karnataka", 12.9716, 77.5946],
  ["jaipur", "Jaipur", "Rajasthan", 26.9124, 75.7873],
  ["guwahati", "Guwahati", "Assam", 26.1445, 91.7362],
  ["bhubaneswar", "Bhubaneswar", "Odisha", 20.2961, 85.8245],
].map(([id, name, state, latitude, longitude]) => ({
  id: String(id),
  name: String(name),
  state: String(state),
  latitude: Number(latitude),
  longitude: Number(longitude),
  timezone: "Asia/Kolkata",
}));
export const condition = (code: number) =>
  code === 0
    ? "Clear skies"
    : code <= 3
      ? "Partly cloudy"
      : code <= 48
        ? "Foggy"
        : code <= 67
          ? "Rain showers"
          : code <= 77
            ? "Snowfall"
            : code <= 82
              ? "Rain showers"
              : "Thunderstorms";
export const timeLabel = (time: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(time));
export const dayLabel = (time: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(time));
export const temperature = (c: number, unit = "c") =>
  Math.round(unit === "f" ? (c * 9) / 5 + 32 : c);
