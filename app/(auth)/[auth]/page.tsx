import { notFound, redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getUser } from "@/lib/auth";
import { connected } from "@/lib/supabase/server";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ auth: string }>;
  searchParams: Promise<{error?: string}>;
}) {
  const { auth } = await params;
  const modes = {
    login: "login",
    register: "register",
    "forgot-password": "reset",
    "reset-password": "update-password",
    "resend-confirmation": "resend",
  } as const;
  if (!(auth in modes)) notFound();
  const [user, query] = await Promise.all([getUser(), searchParams]);
  if (user && (auth === "login" || auth === "register") && !query.error) redirect("/dashboard");
  return (
    <AuthForm
      mode={modes[auth as keyof typeof modes]}
      demo={process.env.NEXT_PUBLIC_DEMO_MODE === "true"}
      emailEnabled={(!connected() && auth === "register") || process.env.AUTH_EMAIL_ENABLED === "true"}
      passwordSession={Boolean(user && !user.email.endsWith("@weathergpt.demo"))}
      initialMessage={query.error ? "This email link is invalid, expired, or already used. Request a new link and open it in the same browser." : ""}
    />
  );
}
