"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authFormSchema, type AuthMode, EMAIL_UNAVAILABLE } from "@/lib/auth-validation";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Leaf,
  UserRound,
  LoaderCircle,
} from "lucide-react";
import { api } from "./providers";
import { Logo, Badge } from "./ui";
import { ThemeToggle } from "./theme-toggle";
import { useHydrated } from "./use-hydrated";
type Values = z.infer<ReturnType<typeof authFormSchema>>;
export function AuthForm({
  mode = "login",
  demo,
  initialMessage = "",
  emailEnabled = true,
  passwordSession = true,
}: {
  mode?: AuthMode;
  demo: boolean;
  initialMessage?: string;
  emailEnabled?: boolean;
  passwordSession?: boolean;
}) {
  const hydrated = useHydrated();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [failed, setFailed] = useState(Boolean(initialMessage));
  const [busy, setBusy] = useState(false);
  const emailOnly = mode === "reset" || mode === "resend";
  const creatingPassword = mode === "register" || mode === "update-password";
  const unavailable = (!emailEnabled && (mode === "register" || emailOnly)) || (mode === "update-password" && !passwordSession);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(authFormSchema(mode)),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      persona: "citizen",
      remember: true,
    },
  });
  async function submit(v: Values) {
    if (unavailable) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      const result = await api<{ confirmation?: boolean }>(
        `/api/auth/${mode}`,
        v,
      );
      if (result.confirmation) {
        setMessage("If your account needs confirmation, check your inbox and spam folder for the link. Already registered? Sign in instead.");
      } else if (mode === "reset")
        setMessage(
          "If this email is registered, a recovery link has been requested. Check your inbox and spam folder.",
        );
      else if (mode === "resend") setMessage("If this account needs confirmation, a new link has been requested. Check your inbox and spam folder.");
      else {
        window.location.assign(mode === "register" ? "/onboarding" : "/dashboard");
      }
    } catch (e) {
      setMessage((e as Error).message);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Logo />
        <div>
          <Badge tone="light">TRUSTED WEATHER INTELLIGENCE</Badge>
          <h1>
            Know what’s coming.
            <br />
            Be ready for it.
          </h1>
          <p>
            From the first seed to the journey home.
            <br />
            Weather intelligence for every decision.
          </p>
          <div className="auth-orb">
            <div className="sun-orb" />
            <div className="cloud cloud-front" />
          </div>
          <div className="auth-quote">
            <ShieldCheck />
            <span>
              Grounded in data.
              <br />
              <strong>Built for Bharat.</strong>
            </span>
          </div>
        </div>
        <small>
          Decision support, with transparent sources and uncertainty.
        </small>
      </div>
      <div className="auth-form-side">
        <div className="auth-theme"><ThemeToggle /></div>
        <Link className="text-link back-home" href="/">
          ← Back to home
        </Link>
        <div className="auth-form-wrap">
          <p className="eyebrow">YOUR PERSONAL WEATHER WORKSPACE</p>
          <h1>
            {mode === "register"
              ? "Create your account"
              : mode === "reset"
                ? "Reset your password"
                : mode === "resend"
                  ? "Confirm your email"
                : mode === "update-password"
                  ? "Choose a new password"
                  : "Welcome back."}
          </h1>
          <p className="muted">
            {mode === "login"
              ? "Sign in for a clearer view of your day."
              : "Stay informed. Make your next decision with confidence."}
          </p>
          {unavailable && <div className="notice" role="status"><div><p>{mode === "update-password" ? "Open a valid password-recovery link from your email to continue. Shared demo passwords cannot be changed." : EMAIL_UNAVAILABLE}</p><Link className="text-link" href={mode === "update-password" ? "/forgot-password" : "/login"}>{mode === "update-password" ? "Request a recovery link" : "Explore demo accounts"}</Link></div></div>}
          {mode === "update-password" && passwordSession && <p className="muted">Choose a new password for your signed-in account.</p>}
          <form onSubmit={handleSubmit(submit)} className="form-stack">
            <fieldset disabled={!hydrated || busy} style={{ display: "contents" }}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  {...register("name")}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  aria-describedby="name-error"
                />
                <span id="name-error" className="field-error">{errors.name?.message}</span>
              </label>
            )}
            {mode !== "update-password" && <label>
              Email address
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby="email-error"
              />
              <span id="email-error" className="field-error">
                {errors.email?.message}
              </span>
            </label>}
            {!emailOnly && (
              <label>
                Password
                <div className="password-input">
                  <input
                    {...register("password")}
                    type={visible ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    aria-invalid={!!errors.password}
                    aria-describedby={creatingPassword ? "password-error password-hint" : "password-error"}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={visible ? "Hide password" : "Show password"}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span id="password-error" className="field-error">
                  {errors.password?.message}
                </span>
                {creatingPassword && <small id="password-hint" className="muted">Use at least 12 characters. A memorable passphrase works well.</small>}
              </label>
            )}
            {creatingPassword && <label>Confirm password<input {...register("confirmPassword")} type={visible ? "text" : "password"} autoComplete="new-password" maxLength={128} aria-invalid={!!errors.confirmPassword} aria-describedby="confirm-error"/><span id="confirm-error" className="field-error">{errors.confirmPassword?.message}</span></label>}
            {mode === "register" && (
              <label>
                I’m here as a
                <select {...register("persona")}>
                  <option value="citizen">Citizen</option>
                  <option value="farmer">Farmer</option>
                  <option value="disaster_manager">Disaster manager</option>
                  <option value="researcher">Researcher</option>
                </select>
              </label>
            )}
            {mode === "login" && (
              <div className="form-options">
                <label className="checkbox">
                  <input type="checkbox" {...register("remember")} /> Remember
                  me
                </label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            )}
            {message && (
              <div className="notice" role={failed ? "alert" : "status"}>
                {message}
              </div>
            )}
            <button className="btn wide" disabled={busy || unavailable}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : mode === "login" ? (
                "Sign in"
              ) : mode === "register" ? (
                "Create account"
              ) : mode === "reset" ? (
                "Send recovery link"
              ) : mode === "resend" ? (
                "Resend confirmation"
              ) : (
                "Save password"
              )}
              <ArrowRight size={17} />
            </button>
            </fieldset>
          </form>
          {(mode === "login" || mode === "register") && <p className="auth-switch"><Link href="/resend-confirmation">Resend confirmation</Link></p>}
          {demo && mode === "login" && (
            <div className="demo-panel">
              <div className="divider">
                <span>EXPLORE THE DEMONSTRATION</span>
              </div>
              <div className="demo-buttons">
                {[
                  ["citizen", UserRound],
                  ["farmer", Leaf],
                  ["admin", ShieldCheck],
                ].map(([role, Icon]) => {
                  const I = Icon as typeof Leaf;
                  const r = String(role);
                  return (
                    <button
                      key={r}
                      disabled={!hydrated || busy}
                      onClick={() => {
                        setValue("email", `${r}@weathergpt.demo`);
                        setValue(
                          "password",
                          `${r[0].toUpperCase() + r.slice(1)}@12345`,
                        );
                      }}
                    >
                      <I size={20} />
                      <strong>{r[0].toUpperCase() + r.slice(1)} Demo</strong>
                      <span>Use demo account</span>
                    </button>
                  );
                })}
              </div>
              <p className="demo-notice">
                These credentials are for local/demo use only. Disable or rotate
                them before production deployment.
              </p>
            </div>
          )}
          <p className="auth-switch">
            {mode !== "login"
              ? "Already have an account?"
              : "New to WeatherGPT?"}{" "}
            <Link href={mode !== "login" ? "/login" : "/register"}>
              {mode !== "login" ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
