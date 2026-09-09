"use client";

import { useLayoutEffect } from "react";
import {
  buildClubColourHintCookie,
  clearClubColourHintCookie,
} from "@/lib/clubs/colour-hint";

/** Applies club colour on `#app-shell` after the header streams, without blocking page RSC. */
export function ClubColourBinder({ colour }: { colour: string | null }) {
  useLayoutEffect(() => {
    const root = document.getElementById("app-shell");
    if (!root) return;
    if (colour) {
      root.setAttribute("data-club-colour", "true");
      root.style.setProperty("--club-colour", colour);
      document.cookie = buildClubColourHintCookie(colour);
      return;
    }
    root.setAttribute("data-club-colour", "false");
    root.style.removeProperty("--club-colour");
    document.cookie = clearClubColourHintCookie();
  }, [colour]);

  return null;
}
