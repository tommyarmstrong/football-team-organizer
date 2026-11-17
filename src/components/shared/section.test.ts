import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Section } from "@/components/shared/section";

describe("Section", () => {
  it("keeps the default 16px gap so other pages are unchanged", () => {
    const html = renderToStaticMarkup(
      Section({ title: "Goals", children: "body" }),
    );
    expect(html).toContain('<section class="space-y-4">');
    expect(html).toContain("font-display text-xl tracking-tight sm:text-2xl");
  });

  it("tightens the heading gap to 12px when compact, keeping the heading style", () => {
    const html = renderToStaticMarkup(
      Section({ title: "Goals", compact: true, children: "body" }),
    );
    expect(html).toContain('<section class="space-y-3">');
    expect(html).toContain("font-display text-xl tracking-tight sm:text-2xl");
  });
});
