import { unstable_rethrow } from "next/navigation";

export type ActionFailure = { error: string };
export const UNCONFIRMED_SAVE: ActionFailure = {
  error: "We couldn't confirm the save. Your changes are still here. Check your connection and try again.",
};

// Catch transport failures at the browser/action boundary, where server-side
// try/catch cannot run. Callers retain their draft until a confirmed result.
export async function runAction<State extends { error?: string }>(
  operation: () => Promise<State>, failure: State & ActionFailure,
): Promise<State> {
  try {
    return await operation();
  } catch (error) {
    // Redirects/not-found are framework control flow, not failed saves.
    unstable_rethrow(error);
    return failure;
  }
}
