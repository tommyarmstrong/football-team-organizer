import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { APP_NAME } from "@/lib/constants";
import { CreateClubForm } from "@/components/clubs/create-club-form";
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
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No club access yet</CardTitle>
            <CardDescription>
              You are signed in to {APP_NAME}, but your account is not linked to
              a club or team. Create a new club to get started as its
              management, or ask an existing club&apos;s management to add you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateClubForm />
          </CardContent>
        </Card>

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
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
