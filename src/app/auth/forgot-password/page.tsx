import Link from "next/link";
import { AuthShell } from "@/components/brand/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="Enter the email on your account. If it matches a login, we will send a reset link."
    >
      <div className="space-y-6">
        <ForgotPasswordForm />
        <p className="text-center text-sm">
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
