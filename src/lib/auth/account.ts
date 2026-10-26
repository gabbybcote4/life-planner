import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Deliberately request-scoped: do not memoize identities across requests.
// Each page and mutation checks verified claims close to its data access.
export async function getAccountContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string" || !data.claims.sub) return null;
  return {
    supabase,
    userId: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : "Your account",
  };
}

export async function requireAccount() {
  const account = await getAccountContext();
  if (!account) redirect("/login");
  return account;
}

