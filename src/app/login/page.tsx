import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginFormWithGoogle as LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <div className="bg-background flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{APP_NAME}</CardTitle>
          <CardDescription>
            Sign in with email and password, or Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<p className="text-muted-foreground text-sm">Loading…</p>}
          >
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
