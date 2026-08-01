import { redirect } from "next/navigation";

/** Root is handled by proxy; this is a safe fallback. */
export default function HomePage() {
  redirect("/dashboard");
}
