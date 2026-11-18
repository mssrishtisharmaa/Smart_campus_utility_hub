import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
let instance: DatabaseSync | undefined;
export function demoEnabled() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
export function db() {
  if (!demoEnabled())
    throw new Error(
      "Local demonstration mode is disabled. Configure Supabase.",
    );
  if (instance) return instance;
  const dir = join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  instance = new DatabaseSync(join(dir, "demo.sqlite"));
  instance.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,persona TEXT NOT NULL); CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT NOT NULL,user_id TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS records_owner ON records(user_id,kind);",
  );
  for (const persona of ["citizen", "farmer", "admin"]) {
    const id = `demo-${persona}`;
    instance
      .prepare("INSERT OR IGNORE INTO users VALUES(?,?,?,?,?,?)")
      .run(
        id,
        `${persona}@weathergpt.demo`,
        hashPassword(`${persona[0].toUpperCase() + persona.slice(1)}@12345`),
        persona === "farmer"
          ? "Aarav Sharma"
          : persona === "admin"
            ? "Admin"
            : "Aarav",
        persona === "admin" ? "admin" : "citizen",
        persona === "farmer" ? "farmer" : "citizen",
      );
  }
  if (
    !instance
      .prepare("SELECT id FROM records WHERE kind='alerts' LIMIT 1")
      .get()
  )
    seedLocal(instance);
  return instance;
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function sessionSecret() {
  if (process.env.DEMO_SESSION_SECRET) return process.env.DEMO_SESSION_SECRET;
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "DEMO_SESSION_SECRET must be configured for a production demo build.",
    );
  const path = join(process.cwd(), ".data", "session-key");
  mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  if (!existsSync(path))
    writeFileSync(path, randomBytes(48).toString("hex"), { mode: 0o600 });
  return readFileSync(path, "utf8");
}
function seedLocal(sql: DatabaseSync) {
  const now = new Date().toISOString();
  const put = (id: string, kind: string, user: string, payload: unknown) =>
    sql
      .prepare("INSERT OR IGNORE INTO records VALUES(?,?,?,?,?,?)")
      .run(id, kind, user, JSON.stringify(payload), now, now);
  for (const [i, title, hazard, severity, city, lat, lon] of [
    [
      1,
      "Heavy rain expected this evening",
      "Heavy rain",
      "Alert",
      "New Delhi",
      28.61,
      77.21,
    ],
    [
      2,
      "Take precautions in afternoon heat",
      "Heat wave",
      "Advisory",
      "Jaipur",
      26.91,
      75.79,
    ],
    [3, "Thunderstorm watch", "Thunderstorm", "Watch", "Mumbai", 19.07, 72.87],
  ])
    put(`alert-${i}`, "alerts", "system", {
      title,
      description:
        "Demonstration scenario for preparedness. This is not an official warning.",
      hazard_type: hazard,
      severity,
      location_name: city,
      latitude: lat,
      longitude: lon,
      origin: "derived",
      source_name: "WeatherGPT demonstration",
      source_url: "",
      issued_at: now,
      valid_from: now,
      valid_to: new Date(Date.now() + 48 * 3600000).toISOString(),
      instructions:
        "Monitor official IMD and local-authority information. Avoid exposed areas during severe weather.",
      is_demo: true,
      published: true,
    });
  for (const user of ["demo-citizen", "demo-farmer", "demo-admin"]) {
    put(`welcome-${user}`, "notifications", user, {
      title: "Welcome to WeatherGPT Bharat",
      body: "Explore the weather, ask a question and save your first location.",
      status: "unread",
    });
    put(`location-${user}`, "saved_locations", user, {
      id: "new-delhi",
      name: "New Delhi",
      state: "Delhi",
      latitude: 28.6139,
      longitude: 77.209,
      timezone: "Asia/Kolkata",
      label: "Home",
    });
  }
  put("farm-1", "farms", "demo-farmer", {
    name: "Yamuna Farm",
    crop: "Tomato",
    crop_stage: "Flowering",
    area_hectares: 2,
  });
  put("farm-2", "farms", "demo-farmer", {
    name: "North Field",
    crop: "Wheat",
    crop_stage: "Vegetative",
    area_hectares: 1.5,
  });
  put("report-1", "community_reports", "demo-citizen", {
    type: "Heavy rain",
    description:
      "Demonstration report: water accumulating near the market road.",
    location: "New Delhi",
    observed_at: now,
    severity: "Moderate",
    status: "submitted",
    public_display: true,
    consent: true,
    is_demo: true,
  });
}
