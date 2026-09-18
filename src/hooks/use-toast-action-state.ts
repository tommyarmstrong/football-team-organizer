"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionState } from "@/lib/action-state";
import { toastSuccess } from "@/lib/toast";

export function useActionToast(state: ActionState, pending: boolean) {
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      toastSuccess(state.success);
    }
    wasPending.current = pending;
  }, [pending, state.success]);
}

export function useToastActionState<State extends ActionState, Payload>(
  action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
  initialState: Awaited<State>,
  permalink?: string,
) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState,
    permalink,
  );
  useActionToast(state, pending);
  return [state, formAction, pending] as const;
}
