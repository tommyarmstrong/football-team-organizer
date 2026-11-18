import { Button } from "@/components/ui/button";

export function ShowAllToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11"
      aria-expanded={expanded}
      onClick={onToggle}
    >
      {expanded ? "Show less" : "Show all"}
    </Button>
  );
}
