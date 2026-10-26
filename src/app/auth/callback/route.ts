import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(new URL("/", request.url));
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
    } catch {
      // Never display or log confirmation codes, tokens, or provider error details.
    }
  }
  const response = NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
