import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "@fontsource-variable/manrope";
import "./globals.css";
import "./cinematic.css";
import "./premium.css";
export const metadata: Metadata = {
  title: {
    default: "WeatherGPT Bharat — Weather intelligence for every decision",
    template: "%s | WeatherGPT Bharat",
  },
  description:
    "Evidence-grounded weather forecasts, farming action windows and conversational weather intelligence for India.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#102c46",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
