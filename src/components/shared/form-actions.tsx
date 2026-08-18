import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export function FormActions({
  pending,
  cancelHref,
  form,
}: {
  pending: boolean;
  cancelHref: string;
  form?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" form={form} disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Link href={cancelHref} className={buttonVariants()}>
        Cancel
      </Link>
    </div>
  );
}
