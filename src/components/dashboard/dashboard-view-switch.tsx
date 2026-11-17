"use client";

import { useState, type ReactNode } from "react";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";

export type DashboardView = {
  id: string;
  label: string;
  content: ReactNode;
};

/** One card whose filter shows a single table at a time. */
export function DashboardViewSwitch({
  title,
  views,
}: {
  title: string;
  views: DashboardView[];
}) {
  const [active, setActive] = useState(views[0]?.id ?? "");

  return (
    <Section title={title}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={title}>
          {views.map((view) => {
            const pressed = view.id === active;
            return (
              <Button
                key={view.id}
                type="button"
                size="sm"
                variant={pressed ? "default" : "outline"}
                aria-pressed={pressed}
                onClick={() => setActive(view.id)}
              >
                {view.label}
              </Button>
            );
          })}
        </div>
        {views.map((view) => (
          <div
            key={view.id}
            data-dashboard-panel={view.id}
            hidden={view.id !== active}
          >
            {view.content}
          </div>
        ))}
      </div>
    </Section>
  );
}
