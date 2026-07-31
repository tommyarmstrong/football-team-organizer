import { cn } from "@/lib/utils";
import { clubIconSrc } from "@/lib/clubs/branding";

export function ClubIcon({
  iconUrl,
  alt = "Club icon",
  className,
  size = 28,
}: {
  iconUrl?: string | null;
  alt?: string;
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic club icons (local default or Supabase URL)
    <img
      src={clubIconSrc(iconUrl)}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "size-7 shrink-0 rounded-md object-cover shadow-sm ring-1 ring-black/10",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
