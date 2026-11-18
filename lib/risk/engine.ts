import type { Weather, Risk, Hour, Advisory } from "@/types";
export const RULES = {
  version: "bharat-1.0-demo",
  rainProbability: 50,
  sprayWind: 15,
  heat: 38,
  strongWind: 40,
  heavyRain: 30,
  lowVisibility: 1000,
};
export function calculateRisk(w: Weather): Risk {
  const hazards: string[] = [];
  const actions: string[] = [];
  let level: Risk["level"] = "Safe";
  const next = w.hourly.slice(0, 24);
  const rain = next.reduce((s, h) => s + h.precipitation, 0);
  if (w.current.apparent >= RULES.heat) {
    hazards.push("Heat stress");
    actions.push("Reduce midday exertion, rest in shade and drink water.");
    level = "Advisory";
  }
  if (next.some((h) => h.wind >= RULES.strongWind)) {
    hazards.push("Strong wind");
    actions.push("Secure loose objects and avoid exposed outdoor work.");
    level = "Watch";
  }
  if (rain >= RULES.heavyRain) {
    hazards.push("Heavy rainfall");
    actions.push(
      "Avoid waterlogged roads and monitor official local warnings.",
    );
    level = "Alert";
  }
  if (next.some((h) => h.code >= 95)) {
    hazards.push("Thunderstorm potential");
    actions.push(
      "Move indoors when thunder is heard; avoid trees and open fields.",
    );
    if (level !== "Alert") level = "Watch";
  }
  if (
    w.current.visibility !== null &&
    w.current.visibility < RULES.lowVisibility
  ) {
    hazards.push("Poor visibility");
    actions.push("Allow additional travel time and reduce speed.");
    if (level === "Safe") level = "Advisory";
  }
  if (!hazards.length) {
    actions.push(
      "No threshold-based hazards detected. Check the forecast before outdoor activity.",
    );
  }
  const stale = Date.now() - new Date(w.retrievedAt).getTime() > 3600000;
  const confidence: Risk["confidence"] = w.isDemo || stale ? "Low" : "Medium";
  return {
    level,
    hazards,
    actions,
    confidence,
    reasons: w.isDemo
      ? ["Demonstration data; unsuitable for real decisions."]
      : [
          "Single forecast provider; no independent provider agreement.",
          stale
            ? "Data is older than one hour."
            : "Retrieved within the last hour.",
          "Local conditions can differ from the forecast grid.",
        ],
    ruleVersion: RULES.version,
  };
}
export function actionWindows(
  hours: Hour[],
  activity = "Pesticide spraying",
): Advisory[] {
  const windows: Advisory[] = [];
  for (let i = 0; i <= hours.length - 3; i++) {
    const block = hours.slice(i, i + 3);
    if (
      new Date(block[2].time).getTime() - new Date(block[0].time).getTime() !==
      7200000
    )
      continue;
    const rainProbability = Math.max(...block.map((h) => h.rainProbability)),
      wind = Math.max(...block.map((h) => h.wind)),
      temperature = Math.max(...block.map((h) => h.temperature));
    const rain = block.reduce((s, h) => s + h.precipitation, 0);
    const reasons: string[] = [];
    if (
      /spray|fertiliz|harvest|sow|transplant/i.test(activity) &&
      rainProbability > RULES.rainProbability
    )
      reasons.push("Rain may interrupt this activity.");
    if (/spray/i.test(activity) && wind > RULES.sprayWind)
      reasons.push("Wind increases spray drift.");
    if (temperature >= RULES.heat)
      reasons.push("Heat stress requires extra precautions.");
    if (/irrigation/i.test(activity) && rain > 3)
      reasons.push("Expected rain may reduce irrigation needs.");
    if (block.some((h) => h.code >= 95))
      reasons.push("Thunderstorm risk: avoid outdoor activity.");
    if (/livestock/i.test(activity) && wind > RULES.strongWind)
      reasons.push("Provide sheltered housing for livestock.");
    const score = 100 - reasons.length * 35 - rainProbability / 10 - wind / 10;
    windows.push({
      status:
        reasons.length >= 2 || block.some((h) => h.code >= 95)
          ? "Avoid"
          : reasons.length
            ? "Caution"
            : "Suitable",
      start: block[0].time,
      end: new Date(new Date(block[2].time).getTime() + 3600000).toISOString(),
      reasons: reasons.length
        ? reasons
        : ["Rain, wind and temperature are within demonstration thresholds."],
      rainProbability,
      wind,
      temperature,
      score,
    });
  }
  const ranked = windows.sort((a, b) => b.score - a.score);
  const selected: Advisory[] = [];
  for (const w of ranked) {
    if (
      selected.every(
        (s) =>
          new Date(w.start) >= new Date(s.end) ||
          new Date(w.end) <= new Date(s.start),
      )
    )
      selected.push(w);
    if (selected.length === 3) break;
  }
  return selected;
}
export function compareForecast(previous: Weather, current: Weather) {
  const before = new Map(previous.hourly.map((h) => [h.time, h]));
  return current.hourly.flatMap((h) => {
    const old = before.get(h.time);
    return old && Math.abs(h.rainProbability - old.rainProbability) >= 15
      ? [
          {
            time: h.time,
            before: old.rainProbability,
            after: h.rainProbability,
            change: h.rainProbability - old.rainProbability,
          },
        ]
      : [];
  });
}
