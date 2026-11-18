"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Menu,
  X,
  ShieldCheck,
  Leaf,
  Navigation,
  Radio,
  FlaskConical,
  CloudRain,
  Wind,
  Sparkles,
  Database,
  Globe2,
  Check,
  Mic,
  Sun,
  Layers,
} from "lucide-react";
import { Logo, Badge } from "./ui";
import { LocationSearch } from "./location-search";
import { ThemeToggle } from "./theme-toggle";
const personas = [
  {
    icon: Navigation,
    title: "Your everyday, weather-ready.",
    label: "FOR CITIZENS",
    text: "The commute. The weekend. The walk home. Turn the forecast into a plan.",
  },
  {
    icon: Leaf,
    title: "Better timing. Better field days.",
    label: "FOR FARMERS",
    text: "Explore three-hour action windows for spraying, irrigation, and harvesting.",
  },
  {
    icon: Radio,
    title: "Local signals. Clearer awareness.",
    label: "FOR RESPONSE TEAMS",
    text: "Review community observations and share source-labelled preparedness guidance.",
  },
  {
    icon: FlaskConical,
    title: "Follow the data. Ask deeper.",
    label: "FOR RESEARCHERS",
    text: "Inspect historical series, compare model output, and export evidence.",
  },
];
export function CinematicLanding() {
  const root = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [persona, setPersona] = useState(0);
  const reduced = useReducedMotion();
  const router = useRouter();
  useEffect(() => {
    if (
      reduced ||
      (navigator as Navigator & {connection?: {saveData?: boolean}}).connection?.saveData
    )
      return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".cinematic-image",
          { scale: 1.07 },
          {
            scale: 1,
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: ".cinematic-hero",
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
        gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 24, opacity: 0.85 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });
      }, root);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, [reduced]);
  const P = personas[persona].icon;
  return (
    <MotionConfig reducedMotion="user">
      <div className="cinematic" ref={root}>
        <a className="skip-link" href="#landing-main">
          Skip to content
        </a>
        <header className="cinematic-nav">
          <Logo />
          <nav className={menu ? "mobile-menu open" : ""}>
            <a href="#intelligence" onClick={() => setMenu(false)}>
              The intelligence
            </a>
            <a href="#for-everyone" onClick={() => setMenu(false)}>
              Built for you
            </a>
            <Link href="/datasets">
              Data & evidence <ArrowUpRight size={12} />
            </Link>
          </nav>
          <div>
            <ThemeToggle />
            <Link className="cinematic-login" href="/login">
              Sign in
            </Link>
            <Link className="btn pearl" href="/login">
              Explore WeatherGPT <ArrowUpRight size={15} />
            </Link>
            <button
              className="icon-button mobile-only"
              onClick={() => setMenu(!menu)}
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </header>
        <main id="landing-main">
          <section className="cinematic-hero">
            <div className="cinematic-image">
              <Image
                src="/images/monsoon-bharat.webp"
                alt="Illustrative monsoon clouds over green Indian fields and a winding river"
                fill
                priority
                sizes="100vw"
                quality={85}
              />
            </div>
            <div className="cinematic-shade" />
            <div className="hero-coordinate">
              <span className="live-dot" /> DESIGNED FOR BHARAT{" "}
              <span>20.5937° N · 78.9629° E</span>
            </div>
            <div className="cinematic-hero-content">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65 }}
              >
                <span className="outline-pill">
                  <Sparkles size={13} /> WEATHER INTELLIGENCE. HUMAN
                  UNDERSTANDING.
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                The sky has a story.
                <br />
                <span>
                  Know what it means
                  <br className="mobile-break" /> for you.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22 }}
              >
                Ask the weather. Understand the risk. Take the right action.
                <br />
                Evidence-grounded answers for a billion everyday decisions.
              </motion.p>
              <motion.div
                className="cinematic-cta"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <Link className="btn mint" href="/login">
                  Meet your weather companion <ArrowUpRight size={19} />
                </Link>
                <a href="#intelligence" className="hero-secondary">
                  See how it works <ArrowDown size={16} />
                </a>
              </motion.div>
              <div className="hero-trust">
                <span>
                  <ShieldCheck size={15} /> Traceable sources
                </span>
                <span>
                  <Globe2 size={15} /> Built for India
                </span>
                <span>
                  <Leaf size={15} /> Decisions, not just degrees
                </span>
              </div>
            </div>
            <motion.div
              className="floating-evidence"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <div>
                <span className="floating-star">
                  <Sparkles size={18} />
                </span>
                <span>FROM FORECAST TO FIELD</span>
                <Badge tone="light">Example</Badge>
              </div>
              <p>
                “Can I spray my tomato crop
                <br />
                tomorrow morning?”
              </p>
              <div className="floating-result">
                <span className="result-line" />
                <span>
                  Weather checked. Rules applied.
                  <br />
                  <strong>Your action window, with evidence.</strong>
                </span>
                <ArrowUpRight size={20} />
              </div>
            </motion.div>
            <div className="hero-bottom-line">
              <span>01 / THE FORECAST, REIMAGINED</span>
              <span>
                AI-generated landscape · illustrative, not weather data
              </span>
              <a href="#intelligence" aria-label="Explore the intelligence">
                <ArrowDown size={18} />
              </a>
            </div>
          </section>
          <div className="source-ribbon">
            <span>TRANSPARENCY IS BUILT IN.</span>
            <div>
              <Database size={17} /> Open-Meteo <small>Forecasts</small>
            </div>
            <div>
              <Layers size={17} /> NOAA GFS <small>Model adapter</small>
            </div>
            <div>
              <Globe2 size={17} /> ERA5 <small>Reanalysis adapter</small>
            </div>
            <Link href="/datasets">
              Meet the sources <ArrowUpRight size={15} />
            </Link>
          </div>
          <section
            id="intelligence"
            className="intelligence-section reveal-section"
          >
            <div className="editorial-heading">
              <div>
                <span className="section-number">
                  01 — WEATHER, WITH CONTEXT
                </span>
                <h2>
                  A forecast tells you what.
                  <br />
                  <em>We help you understand what next.</em>
                </h2>
              </div>
              <p>
                One connected workspace. From the first sign of rain to a better
                time in the field, every answer keeps its evidence close.
              </p>
            </div>
            <div className="intelligence-grid">
              <motion.article
                whileHover={{ y: -5 }}
                className="intelligence-chat"
              >
                <div className="feature-top">
                  <span>
                    <Sparkles size={18} /> CONVERSATIONAL INTELLIGENCE
                  </span>
                  <ArrowUpRight size={20} />
                </div>
                <h3>
                  Less searching.
                  <br />
                  More understanding.
                </h3>
                <p>
                  Ask naturally. Get a clear answer with the forecast, its
                  source, and what remains uncertain.
                </p>
                <div className="mini-conversation">
                  <div className="mini-question">
                    Will it rain on my way home? <Navigation size={14} />
                  </div>
                  <div className="mini-answer">
                    <Sparkles size={18} />
                    <div>
                      <strong>
                        Your question deserves more than a number.
                      </strong>
                      <p>
                        WeatherGPT checks the selected location and period, then
                        explains the forecast and a practical next step.
                      </p>
                      <span>
                        <Check size={12} /> Source · Valid time · Confidence
                      </span>
                    </div>
                  </div>
                  <Link href="/chat" className="mini-input">
                    Ask your first question <Mic size={17} />
                    <span>
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                </div>
              </motion.article>
              <motion.article
                whileHover={{ y: -5 }}
                className="intelligence-window"
              >
                <div className="feature-top">
                  <span>
                    <Leaf size={18} /> ACTION-WINDOW OPTIMIZER
                  </span>
                  <ArrowUpRight size={20} />
                </div>
                <h3>
                  Find your window.
                  <br />
                  Make it count.
                </h3>
                <p>
                  Rank complete three-hour periods using transparent rain, wind,
                  and heat thresholds.
                </p>
                <div className="window-visual">
                  <div>
                    <span>AN ILLUSTRATIVE FIELD DAY</span>
                    <Badge tone="light">Demo</Badge>
                  </div>
                  <div className="window-hours">
                    {["06:00", "09:00", "12:00", "15:00", "18:00"].map(
                      (h, i) => (
                        <div key={h}>
                          <span>{h}</span>
                          <div className={`window-bar bar-${i}`} />
                          {i < 2 ? <Sun size={17} /> : <CloudRain size={17} />}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="window-legend">
                    <span>
                      <i /> Evaluate the better window
                    </span>
                    <span>
                      <Wind size={14} /> Check wind & rain
                    </span>
                  </div>
                </div>
                <Link href="/advisories" className="feature-link">
                  Plan a field activity <ArrowRight size={16} />
                </Link>
              </motion.article>
              <motion.article
                whileHover={{ y: -5 }}
                className="intelligence-evidence"
              >
                <div className="feature-top">
                  <span>
                    <ShieldCheck size={18} /> EVIDENCE YOU CAN INSPECT
                  </span>
                  <ArrowUpRight size={20} />
                </div>
                <h3>
                  Trust is a feature.
                  <br />
                  Show the working.
                </h3>
                <p>
                  Official, model-derived, community, or demo: you should always
                  know the difference.
                </p>
                <div className="provenance-stack">
                  <div>
                    <span className="provenance-dot" /> Source & retrieval time{" "}
                    <Check size={14} />
                  </div>
                  <div>
                    <span className="provenance-dot" /> Rules & confidence
                    reasons <Check size={14} />
                  </div>
                  <div>
                    <span className="provenance-dot" /> Clear limits &
                    uncertainty <Check size={14} />
                  </div>
                </div>
                <Link href="/data-sources" className="feature-link">
                  Explore our evidence standard <ArrowRight size={16} />
                </Link>
              </motion.article>
            </div>
          </section>
          <section
            id="for-everyone"
            className="audience-section reveal-section"
          >
            <div className="editorial-heading">
              <div>
                <span className="section-number">
                  02 — SAME SKY. DIFFERENT STORIES.
                </span>
                <h2>
                  Weather touches everyone.
                  <br />
                  <em>Good guidance feels personal.</em>
                </h2>
              </div>
            </div>
            <div className="audience-layout">
              <div
                className="audience-tabs"
                role="tablist"
                aria-label="Choose a weather persona"
              >
                {personas.map((p, i) => (
                  <button
                    key={p.label}
                    role="tab"
                    aria-selected={persona === i}
                    aria-controls="persona-detail"
                    id={`persona-${i}`}
                    onClick={() => setPersona(i)}
                    className={persona === i ? "active" : ""}
                  >
                    <p.icon size={20} />
                    <span>
                      {
                        [
                          "Citizens",
                          "Farmers",
                          "Response teams",
                          "Researchers",
                        ][i]
                      }
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                ))}
              </div>
              <motion.div
                key={persona}
                id="persona-detail"
                role="tabpanel"
                aria-labelledby={`persona-${persona}`}
                className="audience-detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="audience-icon">
                  <P size={35} />
                </span>
                <div>
                  <span className="section-number">
                    {personas[persona].label}
                  </span>
                  <h3>{personas[persona].title}</h3>
                  <p>{personas[persona].text}</p>
                  <Link href="/register" className="text-link">
                    Make it your workspace <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
          <section className="workflow-section reveal-section">
            <span className="section-number">03 — NO BLACK BOX REQUIRED</span>
            <h2>
              From a question
              <br />
              to a clearer decision.
            </h2>
            <div className="workflow-line">
              {[
                [
                  "01",
                  "You ask.",
                  "A place, a plan, a question. Use text or supported browser voice.",
                ],
                [
                  "02",
                  "We check.",
                  "Retrieve structured data and preserve its source and valid time.",
                ],
                [
                  "03",
                  "Rules evaluate.",
                  "Deterministic safety and activity rules assess the available forecast.",
                ],
                [
                  "04",
                  "You decide.",
                  "An answer, a next step, and the evidence to judge it yourself.",
                ],
              ].map(([n, title, text]) => (
                <div key={n}>
                  <span>{n}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="location-cta reveal-section">
            <div>
              <span className="section-number">A CLEARER DAY STARTS HERE</span>
              <h2>
                Your place.
                <br />
                <em>Your weather. Your next move.</em>
              </h2>
              <p>Start with a city, district, or the place you call home.</p>
            </div>
            <div>
              <LocationSearch
                onSelect={(p) => {
                  localStorage.setItem(
                    "wg-preferences",
                    JSON.stringify({ location: p }),
                  );
                  router.push("/login");
                }}
              />
              <p>
                <ShieldCheck size={14} /> Demonstration accounts available. No
                AI key required.
              </p>
            </div>
          </section>
        </main>
        <footer className="cinematic-footer">
          <div className="cinematic-footer-top">
            <div>
              <Logo />
              <p>Trusted weather intelligence for every decision.</p>
              <span className="footer-status">
                <span /> SIH demonstration platform
              </span>
            </div>
            <div>
              <Link href="/about">Our purpose</Link>
              <Link href="/datasets">Dataset catalogue</Link>
              <Link href="/accessibility">Accessibility</Link>
            </div>
            <div>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/login">
                Open the workspace <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
          <div className="cinematic-footer-bottom">
            <span>WeatherGPT Bharat · Built with purpose.</span>
            <p>
              Decision support, not an official warning service. Follow IMD,
              NDMA and local-authority instructions.
            </p>
            <Link href="/data-sources">
              Sources & artwork credits <ArrowUpRight size={12} />
            </Link>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
