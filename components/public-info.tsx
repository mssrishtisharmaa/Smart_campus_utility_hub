import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui";
import { ThemeToggle } from "./theme-toggle";
const content: Record<string, { title: string; sections: [string, string][] }> =
  {
    about: {
      title: "Weather intelligence for every decision.",
      sections: [
        [
          "Our purpose",
          "WeatherGPT Bharat is a Smart India Hackathon demonstration of evidence-grounded conversational weather intelligence. It translates structured forecasts into practical, traceable guidance for citizens, farmers, response teams and researchers.",
        ],
        [
          "How it works",
          "Weather data is fetched through typed providers. Deterministic rules assess risk and activity windows. Every answer includes source information and uncertainty. Optional AI may order approved sentences; it cannot introduce new weather values.",
        ],
        [
          "Demonstration limits",
          "This is not an IMD service or an operational emergency-warning system. Official feed access, regional agronomic validation, load testing and independent security review remain deployment gates.",
        ],
      ],
    },
    accessibility: {
      title: "Weather information should work for everyone.",
      sections: [
        [
          "Accessible by design",
          "Use keyboard navigation, visible focus, semantic controls and the skip link. The workspace provides high-contrast, reduced-motion, dark-theme and low-bandwidth settings. Charts include accessible descriptions and historical tables.",
        ],
        [
          "Language and voice",
          "English is the primary content language. Hindi navigation and Hindi browser speech input are available. Full translations and BHASHINI integration are planned. Voice support depends on your browser and permissions.",
        ],
        [
          "Feedback",
          "Sign in and use the report form or answer feedback controls to help improve the experience. A formal WCAG conformance audit has not yet been completed.",
        ],
      ],
    },
    privacy: {
      title: "Your data, with a clear purpose.",
      sections: [
        [
          "What is stored",
          "Account details, selected profile preferences, saved locations, conversations, feedback, subscriptions and community reports are stored to provide the app’s features. Device location is requested only when you choose Use my location.",
        ],
        [
          "Storage modes",
          "A configured deployment uses Supabase Auth and row-level database permissions. Local demonstration mode stores accounts and records in a SQLite database on the host computer. Browser storage holds device preferences and a last successful weather summary.",
        ],
        [
          "External services",
          "Weather queries send selected coordinates to weather providers. Optional AI services may receive the question and approved answer sentences. Browser speech services may process audio according to browser-provider terms. Report photos use a private bucket when Supabase is connected.",
        ],
        [
          "Retention and control",
          "You can delete saved places and conversations. Account export, deletion and automated retention controls require additional production work. Do not use a shared demo account for private or sensitive information.",
        ],
      ],
    },
    terms: {
      title: "Use WeatherGPT with informed judgment.",
      sections: [
        [
          "Decision support",
          "WeatherGPT provides decision support and does not replace official emergency instructions. During dangerous weather, follow IMD, NDMA and local-authority directions. Forecasts can be inaccurate or outdated.",
        ],
        [
          "Agricultural and specialist use",
          "Agricultural recommendations are demonstration guidance requiring regional expert validation. Marine samples are not official operational authorizations. Do not use this application for aviation clearance or emergency evacuation decisions.",
        ],
        [
          "Community observations",
          "Community reports may be delayed or inaccurate. Human verification in this demonstration does not certify factual accuracy. Demonstration alerts are not official warnings.",
        ],
        [
          "Data terms",
          "Each data provider retains its licensing, attribution and service limits. The dataset catalogue links to official references. Public API availability does not imply unrestricted commercial usage.",
        ],
      ],
    },
  };
export default async function Page({
  params,
}: {
  params: Promise<{ info: string }>;
}) {
  const { info } = await params;
  const page = content[info];
  if (!page) notFound();
  return (
    <main className="legal-page">
      <div className="public-topbar"><Logo /><ThemeToggle /></div>
      <h1>{page.title}</h1>
      {page.sections.map(([title, text]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </section>
      ))}
      <Link href="/dashboard" className="btn" style={{ marginTop: 30 }}>
        Open your workspace
      </Link>
    </main>
  );
}
