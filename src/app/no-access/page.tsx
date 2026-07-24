import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NoAccessPage() {
  return (
    <div className="bg-background flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>No team access</CardTitle>
          <CardDescription>
            You are signed in to {APP_NAME}, but your account is not linked to a
            team yet. Ask an admin to add you as a coach, or run the local seed
            SQL with your Auth user UUID.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
