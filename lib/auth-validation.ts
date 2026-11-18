import { z } from "zod";

export type AuthMode = "login" | "register" | "reset" | "resend" | "update-password";
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));
export const newPasswordSchema = z.string().min(12, "Use at least 12 characters.").max(128, "Use no more than 128 characters.");
export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Use at least 8 characters.").max(128),
  remember: z.boolean().optional(),
});
export const registrationSchema = credentialsSchema.extend({
  password: newPasswordSchema,
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  persona: z.enum(["citizen", "farmer", "disaster_manager", "researcher"]),
});
export const emailRequestSchema = z.object({ email: emailSchema });
export function authFormSchema(mode: AuthMode) {
  return z.object({ email: z.string(), password: z.string(), confirmPassword: z.string(), name: z.string(), persona: z.enum(["citizen", "farmer", "disaster_manager", "researcher"]), remember: z.boolean() })
    .superRefine((value, ctx) => {
      const selected = mode === "register" ? registrationSchema : mode === "login" ? credentialsSchema : mode === "update-password" ? z.object({password: newPasswordSchema}) : emailRequestSchema;
      const result = selected.safeParse(value);
      if (!result.success) for (const issue of result.error.issues) ctx.addIssue({code:"custom",path:issue.path,message:issue.message});
      if ((mode === "register" || mode === "update-password") && value.password !== value.confirmPassword) ctx.addIssue({code:"custom",path:["confirmPassword"],message:"Passwords do not match."});
    });
}

export const EMAIL_UNAVAILABLE = "Email signup and recovery are not available yet. You can explore the app using a demo account.";
export function authErrorMessage(error: { code?: string; status?: number }, fallback: string) {
  if (error.status === 429 || ["over_email_send_rate_limit", "over_request_rate_limit"].includes(error.code || "")) return "Too many attempts. Wait a minute before trying again.";
  if (error.code === "email_not_confirmed") return "Confirm your email before signing in. Use Resend confirmation if your link has expired.";
  if (["email_address_not_authorized", "email_provider_disabled", "email_address_not_authorized_for_sending"].includes(error.code || "")) return EMAIL_UNAVAILABLE;
  if (error.code === "same_password") return "Choose a password different from your current password.";
  if (error.code === "weak_password") return "Choose a stronger password with at least 12 characters.";
  if (error.code === "reauthentication_needed") return "Open a fresh recovery link before changing your password.";
  return fallback;
}
