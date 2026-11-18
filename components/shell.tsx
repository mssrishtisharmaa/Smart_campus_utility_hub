"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Map,
  Bell,
  Leaf,
  ChartNoAxesCombined,
  MapPin,
  Radio,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  WifiOff,
  PanelLeftClose,
  ArrowUpRight,
  UserRound,
} from "lucide-react";
import { AppProvider, useApp, useOnline, api } from "./providers";
import { Logo, Badge } from "./ui";
import { LocationSearch } from "./location-search";
import { ThemeToggle } from "./theme-toggle";
import { useRecords } from "./records";
import type { User } from "@/types";
import { AlertMonitor } from "./alert-feed";
import { isDemoAccount } from "@/lib/alerts";
const nav = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/chat", "Ask WeatherGPT", MessageSquare],
  ["/map", "Weather map", Map],
  ["/alerts", "Alerts & warnings", Bell],
  ["/advisories", "Farm advisory", Leaf],
  ["/climate", "Climate analytics", ChartNoAxesCombined],
  ["/saved-locations", "Saved locations", MapPin],
  ["/reports", "Community reports", Radio],
] as const;
export function Shell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  return (
    <AppProvider user={user}>
      <AlertMonitor />
      <ShellInner>{children}</ShellInner>
    </AppProvider>
  );
}
function ShellInner({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { user, location, setLocation, language, setLanguage, syncStatus } = useApp();
  const [search, setSearch] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const online = useOnline();
  const notifications = useRecords('notifications');
  const unread = notifications.data?.some(r => r.payload.status !== 'read');
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace-label">YOUR WEATHER WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobile(false)}
              className={path === href ? "active" : ""}
            >
              <Icon size={19} />
              <span>
                {language === "hi"
                  ? {
                      Overview: "अवलोकन",
                      "Ask WeatherGPT": "मौसम से पूछें",
                      "Weather map": "मौसम मानचित्र",
                      "Alerts & warnings": "चेतावनियाँ",
                      "Farm advisory": "कृषि सलाह",
                      "Climate analytics": "जलवायु विश्लेषण",
                      "Saved locations": "सहेजे गए स्थान",
                      "Community reports": "सामुदायिक रिपोर्ट",
                    }[label]
                  : label}
              </span>
              {href === "/chat" && <span className="nav-ai">AI</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trust-card">
            <ShieldCheck size={23} />
            <strong>Evidence before advice.</strong>
            <p>Every answer comes with its source and confidence.</p>
            <Link href="/data-sources">
              Explore our sources <ArrowUpRight size={14} />
            </Link>
          </div>
          {user.role === "admin" && (
            <Link className="sidebar-link" href="/admin">
              <ShieldCheck size={18} />
              <span>Command centre</span>
            </Link>
          )}
          <Link className="sidebar-link" href="/settings">
            <Settings size={18} />
            <span>Settings & accessibility</span>
          </Link>
          <button
            className="sidebar-link collapse-control"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            <PanelLeftClose size={18} />
            <span>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </button>
          <div className="sidebar-user">
            <Link href="/profile" className="avatar">
              {user.name[0]}
            </Link>
            <Link href="/profile">
              <strong>{user.name}</strong>
              <span>{user.persona.replace("_", " ")} workspace</span>
            </Link>
            <button
              className="icon-button"
              title="Sign out"
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api("/api/auth/logout", {});
                  // Discard the authenticated query cache and realtime client on sign-out.
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.assign("/login");
                } catch {
                  toast.error("Could not sign out. Please try again.");
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span>{" "}
              <strong>
                {path.startsWith("/admin")
                  ? "Command centre"
                  : nav.find((n) => n[0] === path)?.[1] ||
                    path.slice(1).replace("-", " ")}
              </strong>
            </span>
          </div>
          <div className="topbar-actions">
            <span className={`sync-pill ${online && syncStatus==='connected'?'connected':''}`} role="status" title={online && syncStatus==='connected'?'Account changes arrive live. Forecasts refresh every minute while this page is visible.':'Live connection status'}><i />{!online?'Offline':syncStatus==='connected'?'Live updates':syncStatus==='local'?'Local mode':syncStatus==='error'?'Reconnecting':'Connecting'}</span>
            <button
              className="location-trigger"
              onClick={() => setSearch(!search)}
              aria-expanded={search}
            >
              <MapPin size={17} />
              {location.name}
              <ChevronDown size={14} />
            </button>
            <select
              aria-label="Interface language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
            </select>
            <ThemeToggle />
            <Link
              className={`icon-button ${unread ? 'notification-dot' : ''}`}
              aria-label="Notifications"
              href="/notifications"
            >
              <Bell size={19} />
            </Link>
            <Link href="/profile" className="avatar small">
              {user.name[0]}
            </Link>
          </div>
        </header>
        {search && (
          <div className="header-search">
            <LocationSearch
              onSelect={(p) => {
                setLocation(p);
                setSearch(false);
              }}
            />
          </div>
        )}
        {!online && (
          <div className="offline-banner">
            <WifiOff size={18} /> You’re offline. Stored forecasts may be
            outdated.
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
        <main id="main-content" className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>
            <ShieldCheck size={14} /> Weather intelligence, with evidence.
          </span>
          <span>
            Decision support · Follow official emergency instructions.
          </span>
          <Badge tone={isDemoAccount(user) ? "amber" : "teal"}>{isDemoAccount(user) ? "Demo alerts" : "Forecast alerts"}</Badge>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          ["/dashboard", "Home", LayoutDashboard],
          ["/chat", "Ask", MessageSquare],
          ["/map", "Map", Map],
          ["/alerts", "Alerts", Bell],
          ["/profile", "Profile", UserRound],
        ].map(([href, label, Icon]) => {
          const I = Icon as typeof Map;
          return (
            <Link
              key={String(href)}
              className={path === href ? "active" : ""}
              href={String(href)}
            >
              <I size={20} />
              <span>{String(label)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
