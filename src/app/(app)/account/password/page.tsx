import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { RequestOwnResetForm } from "@/components/auth/request-own-reset-form";
import { getViewerContext } from "@/lib/authz/context";

export default async function AccountPasswordPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");
  if (!ctx.email) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reset password"
        description="Email yourself a link to choose a new password."
      />
      <RequestOwnResetForm email={ctx.email} />
    </div>
  );
}
