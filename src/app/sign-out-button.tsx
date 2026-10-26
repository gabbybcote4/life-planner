"use client";

import { FormFeedback } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { signOut } from "./login/actions";

export function SignOutButton() {
  const [state, action, pending] = useActionState(signOut, {});
  return <form action={action}>
    <Button variant="secondary" type="submit" disabled={pending} pending={pending} pendingLabel="Signing out...">Sign out</Button>
    <FormFeedback error={state.error} />
  </form>;
}
