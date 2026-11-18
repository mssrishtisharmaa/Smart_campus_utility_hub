import { z } from "zod";
export const placeSchema = z.object({
  id: z.string().max(100),
  name: z.string().min(1).max(120),
  state: z.string().max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z
    .string()
    .max(80)
    .refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
});
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  remember: z.boolean().optional(),
  name: z.string().min(2).max(80).optional(),
  persona: z
    .enum(["citizen", "farmer", "disaster_manager", "researcher"])
    .optional(),
});
export const reportSchema = z.object({
  type: z.string().min(2).max(80),
  description: z.string().min(10).max(2000),
  location: z.string().min(2).max(120),
  observed_at: z.iso.datetime(),
  severity: z.enum(["Minor", "Moderate", "Severe"]),
  consent: z.literal(true),
  public_display: z.boolean(),
  status: z.literal("submitted"),
  photo_path: z.string().max(300).optional(),
});
