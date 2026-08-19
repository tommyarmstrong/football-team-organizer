import type { ReactNode } from "react";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { PitchGraphic } from "@/components/brand/pitch-graphic";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/pitch-pattern.svg')] bg-repeat opacity-80"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:gap-14 lg:py-16">
        <div className="text-primary-foreground relative overflow-hidden rounded-3xl bg-[linear-gradient(145deg,var(--pitch-deep),var(--primary)_58%,var(--pitch-lime))] px-6 py-8 shadow-lg sm:px-8 lg:min-h-[28rem] lg:w-[44%] lg:self-stretch lg:px-10 lg:py-12">
          <PitchGraphic className="absolute -right-8 -bottom-6 h-56 w-auto opacity-20 lg:h-72" />
          <div className="relative space-y-4">
            <span className="bg-pitch-lime/20 text-pitch-lime inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              Matchday ready
            </span>
            <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl">
              {APP_NAME}
            </h1>
            <p className="max-w-sm text-sm text-white/80 sm:text-base">
              {APP_DESCRIPTION}
            </p>
          </div>
        </div>

        <div className="w-full lg:max-w-md">
          <div className="bg-card ring-foreground/10 rounded-3xl p-6 shadow-lg ring-1 sm:p-8">
            <div className="mb-6 space-y-1">
              <h2 className="font-display text-2xl tracking-tight">{title}</h2>
              {description ? (
                <p className="text-muted-foreground text-sm">{description}</p>
              ) : null}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
