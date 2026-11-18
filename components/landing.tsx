"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Leaf,
  Navigation,
  FlaskConical,
  Radio,
  Sparkles,
  Globe,
  CloudSun,
  Check,
} from "lucide-react";
import { Logo, Badge } from "./ui";
import { LocationSearch } from "./location-search";
export function Landing() {
  const router = useRouter();
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav>
          <a href="#features">Features</a>
          <a href="#solutions">Solutions</a>
          <Link href="/data-sources">Data sources</Link>
          <Link href="/accessibility">Accessibility</Link>
        </nav>
        <div>
          <Link className="sign-in-link" href="/login">
            Sign in
          </Link>
          <Link className="btn" href="/login">
            Open WeatherGPT <ArrowRight size={16} />
          </Link>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-copy">
            <Badge tone="teal">MADE FOR INDIA. GROUNDED IN EVIDENCE.</Badge>
            <h1>
              Ask the weather.
              <br />
              Understand the risk.
              <br />
              <em>Take the right action.</em>
            </h1>
            <p>
              Your everyday weather companion. Clear forecasts, timely guidance,
              and answers that explain what the weather means for you.
            </p>
            <LocationSearch
              onSelect={(p) => {
                localStorage.setItem(
                  "wg-preferences",
                  JSON.stringify({ location: p }),
                );
                router.push("/login");
              }}
            />
            <div className="hero-proof">
              <ShieldCheck size={17} />
              <span>Transparent sources</span>
              <span>·</span>
              <span>Multilingual-ready</span>
              <span>·</span>
              <span>No AI key needed</span>
            </div>
          </div>
          <div className="landing-preview">
            <div className="preview-label">
              <span className="live-dot" /> A CLEARER PICTURE, AT A GLANCE{" "}
              <Badge tone="amber">Demo preview</Badge>
            </div>
            <div className="preview-weather">
              <div>
                <span>
                  <Navigation size={16} /> New Delhi, India
                </span>
                <h2>
                  28<span>°</span>
                </h2>
                <strong>Partly cloudy</strong>
                <p>Feels like 30° · H: 32° L: 24°</p>
              </div>
              <div className="atmosphere-art">
                <div className="sun-orb" />
                <div className="cloud cloud-back" />
                <div className="cloud cloud-front" />
              </div>
            </div>
            <div className="preview-hours">
              {["Now", "12 PM", "3 PM", "6 PM", "9 PM"].map((h, i) => (
                <div key={h}>
                  <span>{h}</span>
                  <CloudSun size={24} />
                  <strong>{[28, 30, 32, 29, 26][i]}°</strong>
                </div>
              ))}
            </div>
            <div className="preview-answer">
              <span className="ai-icon">
                <Sparkles size={22} />
              </span>
              <div>
                <strong>“Can I work outdoors this afternoon?”</strong>
                <p>
                  Ask naturally. Get a practical answer with the forecast, risk,
                  and source together.
                </p>
                <Link href="/login">
                  Try WeatherGPT <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <div className="trust-strip">
          {[
            "Evidence-grounded answers",
            "Personalized alerts",
            "Low-bandwidth support",
            "Official-source-compatible",
          ].map((x) => (
            <span key={x}>
              <Check size={18} />
              {x}
            </span>
          ))}
        </div>
        <section id="solutions" className="landing-section">
          <div className="section-intro">
            <p className="eyebrow">ONE FORECAST. MANY EVERYDAY DECISIONS.</p>
            <h2>
              Weather intelligence,
              <br />
              for your world.
            </h2>
            <p>
              Different lives. Different questions.
              <br />A shared need for information you can understand.
            </p>
          </div>
          <div className="persona-grid">
            {[
              [
                Navigation,
                "For citizens",
                "Plan your commute, your weekend, and the moments in between.",
              ],
              [
                Leaf,
                "For farmers",
                "Find better windows for spraying, irrigation, and field work.",
              ],
              [
                Radio,
                "For disaster teams",
                "Review local reports and communicate clear preparedness guidance.",
              ],
              [
                FlaskConical,
                "For researchers",
                "Explore historical data, coverage, and transparent provenance.",
              ],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Leaf;
              return (
                <Link
                  href="/register"
                  className="persona-card"
                  key={String(title)}
                >
                  <I size={27} />
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                  <ArrowUpRightIcon />
                </Link>
              );
            })}
          </div>
        </section>
        <section id="features" className="how-section">
          <p className="eyebrow">FROM A QUESTION TO AN INFORMED ACTION</p>
          <h2>Clear answers don’t happen by chance.</h2>
          <div className="steps">
            {[
              ["01", "Ask naturally", "Type your question or use your voice."],
              [
                "02",
                "Check the evidence",
                "We retrieve structured weather data for your location.",
              ],
              [
                "03",
                "Evaluate the risk",
                "Transparent rules assess hazards and useful action windows.",
              ],
              [
                "04",
                "Make your decision",
                "See the answer, source, confidence, and limitations.",
              ],
            ].map(([n, h, p]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
          <Link href="/login" className="btn">
            Get your weather outlook <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <div>
          <Logo />
          <p>Trusted weather intelligence for every decision.</p>
          <Badge tone="amber">Demonstration platform · SIH project</Badge>
        </div>
        <div>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-sources">Data attribution</Link>
        </div>
        <p>
          <Globe size={15} /> WeatherGPT provides decision support and does not
          replace official emergency instructions.
        </p>
      </footer>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight className="persona-arrow" size={18} />;
}
