import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AuthForm } from "./auth-form";

async function LoginContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!isSupabaseConfigured()) return <p className="form-message">Sign-in is being set up. Please check back soon.</p>;
  const account = await getAccountContext();
  if (account) redirect("/");
  const { error } = await searchParams;
  return <>
    {error === "confirmation" && <p className="form-error" role="alert">
      That confirmation link expired or could not be verified. Try signing in. If your email still needs confirmation, create your account again to request a new link.
    </p>}
    <AuthForm />
  </>;
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <main className="planner-shell">
    <section className="paper-card" aria-labelledby="welcome-title">
      <Link className="brand" href="/">Life Planner</Link>
      <p className="eyebrow">A little space for your everyday</p>
      <h1 id="welcome-title">Welcome to your next chapter.</h1>
      <p className="intro">Make room for the things that matter, one day at a time.</p>
      <Suspense fallback={<p role="status">Getting your space ready...</p>}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </section>
  </main>;
}

