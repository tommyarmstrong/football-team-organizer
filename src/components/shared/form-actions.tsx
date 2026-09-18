import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export function FormActions({
  pending,
  cancelHref,
  onCancel,
  form,
}: {
  pending: boolean;
  cancelHref?: string;
  onCancel?: () => void;
  form?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" form={form} disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {onCancel ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      ) : cancelHref ? (
        <Link href={cancelHref} className={buttonVariants()}>
          Cancel
        </Link>
      ) : null}
    </div>
  );
}
