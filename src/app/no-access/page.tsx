import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { APP_NAME } from "@/lib/constants";
import { AuthShell } from "@/components/brand/auth-shell";
import { Button } from "@/components/ui/button";

export default function NoAccessPage() {
  return (
    <AuthShell
      title="No club access"
      description={
        <>
          You are signed in to {APP_NAME}, but your account is not linked to a
          club or team. Ask your club&apos;s management to invite you with this
          email address.
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
