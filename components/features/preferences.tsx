"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  Check,
  Settings,
  Save,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { useRecords } from "@/components/records";
import { Badge, Empty, Loading, ErrorState } from "@/components/ui";
import { useAlertFeed } from "@/components/alert-feed";
export function NotificationsPage() {
  const records = useRecords("notifications");
  const feed = useAlertFeed();
  const [unreadOnly,setUnreadOnly] = useState(false);
  if(records.isPending)return <Loading/>;
  if(records.error)return <ErrorState message={records.error.message} retry={()=>void records.refetch()}/>;
  const visible=records.data?.filter(r=>!unreadOnly||r.payload.status!=='read');
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">STAY IN THE KNOW</p>
          <h1>Your notifications</h1>
          <p>Updates from your weather workspace.</p>
        </div>
      </div>
      <div className="notice"><Bell size={18}/><div><strong>{feed.data?.audience==='demo'?'Demonstration weather feed':'Forecast alert feed'}</strong><p>Weather alerts refresh while the app is open. Review current conditions and source details in your alert feed.</p><Link className="text-link" href="/alerts">View weather alerts{feed.data ? ` (${feed.data.alerts.length})` : ''} <ArrowRight size={14}/></Link></div></div>
      <div className="toolbar"><div className="segmented"><button className={!unreadOnly?'active':''} onClick={()=>setUnreadOnly(false)}>All updates</button><button className={unreadOnly?'active':''} onClick={()=>setUnreadOnly(true)}>Unread ({records.data?.filter(r=>r.payload.status!=='read').length||0})</button></div><span className="muted">Reviews and subscribed platform alerts update live.</span></div>
      <div className="stack">
        {visible?.map((r) => (
          <div className="card record-card" key={r.id}>
            <Bell size={21} />
            <div>
              <h3>{String(r.payload.title)}</h3>
              <p>{String(r.payload.body)}</p>
              {['/reports','/alerts'].includes(String(r.payload.href))?<Link className="text-link" href={String(r.payload.href)}>Open update <ArrowRight size={14}/></Link>:null}
              <div className="record-meta">
                <Badge tone={r.payload.status === "read" ? "blue" : "teal"}>
                  {String(r.payload.status)}
                </Badge>
                <span>{new Date(r.created_at).toLocaleString()}</span>
              </div>
            </div>
            <button
              className="icon-button"
              aria-label="Mark notification as read"
              disabled={r.payload.status==='read'||records.save.isPending}
              onClick={() =>
                records.save.mutate({ id: r.id, payload: { status: "read" } })
              }
            >
              <Check size={19} />
            </button>
          </div>
        ))}
        {visible?.length === 0 && (
          <Empty
            title="You’re all caught up."
            description="New in-app notifications will appear here."
          />
        )}
      </div>
    </>
  );
}
export function SettingsPage() {
  const {
    unit,
    setUnit,
    language,
    setLanguage,
    lowBandwidth,
    setLowBandwidth,
    user,
    location,
  } = useApp();
  const { theme, setTheme } = useTheme();
  const [contrast, setContrast] = useState(Boolean(user.preferences?.high_contrast));
  const [reduced, setReduced] = useState(Boolean(user.preferences?.reduced_motion));
  const prefs = useRecords("user_preferences");
  const subscriptions = useRecords("alert_subscriptions");
  const currentSubscription = subscriptions.data?.find(r => r.payload.location === location.name);
  const [draft, setDraft] = useState<{location:string;hazards:string[]}|null>(null);
  const hazards = draft?.location === location.name ? draft.hazards : Array.isArray(currentSubscription?.payload.hazard_types) ? currentSubscription.payload.hazard_types as string[] : ['Heavy rain','Thunderstorm'];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAKE WEATHERGPT YOUR OWN</p>
          <h1>Settings & accessibility</h1>
          <p>Choose a more comfortable way to stay informed.</p>
        </div>
      </div>
      <div className="content-grid">
        <section className="card content-card">
          <h2>
            <Settings size={18} style={{ display: "inline", marginRight: 9 }} />{" "}
            Your experience
          </h2>
          <div className="settings-row">
            <div>
              <strong>Temperature unit</strong>
              <p>Applies to dashboard forecasts.</p>
            </div>
            <select
              aria-label="Temperature unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="c">Celsius · °C</option>
              <option value="f">Fahrenheit · °F</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <strong>Language</strong>
              <p>
                Hindi navigation and voice input are available. Full Hindi
                content is Phase 2.
              </p>
            </div>
            <select
              aria-label="Language preference"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <strong>Appearance</strong>
              <p>Light, dark, or match your device.</p>
            </div>
            <select
              aria-label="Theme"
              value={theme || "light"}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <strong>Low-bandwidth mode</strong>
              <p>Text-first forecasts, no chart animation.</p>
            </div>
            <input
              type="checkbox"
              aria-label="Low-bandwidth mode"
              checked={lowBandwidth}
              onChange={(e) => setLowBandwidth(e.target.checked)}
            />
          </div>
          <div className="settings-row">
            <div>
              <strong>Higher contrast</strong>
              <p>Stronger text and borders.</p>
            </div>
            <input
              type="checkbox"
              aria-label="High contrast"
              checked={contrast}
              onChange={(e) => {
                setContrast(e.target.checked);
                document.documentElement.classList.toggle(
                  "high-contrast",
                  e.target.checked,
                );
              }}
            />
          </div>
          <div className="settings-row">
            <div>
              <strong>Reduced motion</strong>
              <p>Your device’s reduced-motion setting is also respected.</p>
            </div>
            <input
              type="checkbox"
              aria-label="Reduced motion"
              checked={reduced}
              onChange={(e) => {
                setReduced(e.target.checked);
                document.documentElement.classList.toggle(
                  "reduced-motion",
                  e.target.checked,
                );
              }}
            />
          </div>
          <button
            className="btn"
            style={{ marginTop: 22 }}
            onClick={() =>
              prefs.save.mutate(
                {
                  id: prefs.data?.[0]?.id,
                  payload: {
                    ...prefs.data?.[0]?.payload,
                    temperature_unit: unit,
                    theme,
                    language,
                    low_bandwidth: lowBandwidth,
                    high_contrast: contrast,
                    reduced_motion: reduced,
                  },
                },
                {
                  onSuccess: () =>
                    toast.success("Preferences saved to your account."),
                },
              )
            }
          >
            <Save size={16} /> Save preferences
          </button>
        </section>
        <section className="card content-card">
          <h2>
            <Bell size={18} style={{ display: "inline", marginRight: 8 }} />{" "}
            Alert interests
          </h2>
          <p>
            Choose topics for {location.name}. These control live weather popups and matching published-alert notifications. Your alert feed still shows all detected conditions.
          </p>
          <div className="form-stack">
            {[
              "Heavy rain",
              "Thunderstorm",
              "Heat wave",
              "Cold wave",
              "Strong wind",
              "Flood",
              "Cyclone",
              "Fog",
            ].map((h) => (
              <label className="checkbox" key={h}>
                <input
                  type="checkbox"
                  checked={hazards.includes(h)}
                  onChange={(e) =>
                    setDraft({location:location.name,hazards:e.target.checked
                        ? [...hazards, h]
                        : hazards.filter((x) => x !== h)})
                  }
                />
                {h}
              </label>
            ))}
            <label className="checkbox">
              <input type="checkbox" disabled /> Email delivery · Coming in
              Phase 2 (provider setup)
            </label>
            <button
              className="btn secondary"
              onClick={() =>
                subscriptions.save.mutate(
                  {
                    id: currentSubscription?.id,
                    payload: {
                      location: location.name,
                      hazard_types: hazards,
                      in_app_enabled: true,
                      email_enabled: false,
                    },
                  },
                  { onSuccess: () => toast.success("Alert interests saved.") },
                )
              }
            >
              Save alert interests
            </button>
          </div>
          <div className="notice" style={{ marginTop: 24, marginBottom: 0 }}>
            Storage mode:{" "}
            {user.mode === "supabase"
              ? "Connected Supabase"
              : "Persistent local demonstration"}
          </div>
        </section>
      </div>
    </>
  );
}
export function ProfilePage({ onboarding = false }: { onboarding?: boolean }) {
  const { user } = useApp();
  const router = useRouter();
  const prefs = useRecords("user_preferences");
  const [persona, setPersona] = useState(user.persona);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR PERSONAL WEATHER PROFILE</p>
          <h1>
            {onboarding ? "Let’s make this your workspace." : "Your profile"}
          </h1>
          <p>Personalize your guidance without changing the forecast facts.</p>
        </div>
      </div>
      <div className="content-grid">
        <section className="card content-card">
          <div className="record-card" style={{ padding: 0, marginBottom: 24 }}>
            <span
              className="avatar"
              style={{ height: 60, width: 60, fontSize: 24 }}
            >
              {user.name[0]}
            </span>
            <div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <Badge>
                {user.role === "admin" ? "Administrator" : "Citizen account"}
              </Badge>
            </div>
          </div>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              prefs.save.mutate(
                {
                  id: prefs.data?.[0]?.id,
                  payload: {
                    ...prefs.data?.[0]?.payload,
                    persona,
                    onboarding_completed: true,
                  },
                },
                {
                  onSuccess: () => {
                    toast.success("Personal weather profile saved.");
                    router.refresh();
                  },
                },
              );
            }}
          >
            <label>
              My primary interest
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value as typeof persona)}
              >
                <option value="citizen">Everyday planning</option>
                <option value="farmer">Farming and agriculture</option>
                <option value="disaster_manager">Disaster preparedness</option>
                <option value="researcher">Weather and climate research</option>
              </select>
            </label>
            <p className="muted">
              Your persona changes your preferred guidance. It does not grant
              administrator permissions.
            </p>
            <button className="btn">
              <Save size={16} /> Save profile
            </button>
          </form>
        </section>
        <section className="card content-card">
          <h2>Set yourself up for a clearer day.</h2>
          <div className="stack">
            <Link className="btn secondary" href="/saved-locations">
              Add your primary location <ArrowRight size={16} />
            </Link>
            <Link className="btn secondary" href="/settings">
              Choose language and alert interests <ArrowRight size={16} />
            </Link>
            <Link className="btn secondary" href="/advisories">
              Tell us about your farm <ArrowRight size={16} />
            </Link>
            <Link className="btn" href="/dashboard">
              {onboarding ? "Finish or skip setup" : "Back to dashboard"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
