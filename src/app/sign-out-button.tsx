"use client";

import { runAction } from "@/lib/shared/client-actions";

import { FormFeedback } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { signOut } from "./login/actions";

export function SignOutButton() {
  const [state, action, pending] = useActionState(() => runAction(() => signOut(), { error: "Sign-out could not be confirmed. You may still be signed in. Check your connection and try again." }), {});
  return <form action={action}>
    <Button variant="secondary" type="submit" disabled={pending} pending={pending} pendingLabel="Signing out...">Sign out</Button>
    <FormFeedback error={state.error} />
  </form>;
}
