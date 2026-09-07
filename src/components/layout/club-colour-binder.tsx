"use client";

import { useLayoutEffect } from "react";

/** Applies club colour on `#app-shell` after the header streams, without blocking page RSC. */
export function ClubColourBinder({ colour }: { colour: string | null }) {
  useLayoutEffect(() => {
    const root = document.getElementById("app-shell");
    if (!root) return;
    if (colour) {
      root.setAttribute("data-club-colour", "true");
      root.style.setProperty("--club-colour", colour);
      return;
    }
    root.setAttribute("data-club-colour", "false");
    root.style.removeProperty("--club-colour");
  }, [colour]);

  return null;
}
