import type { ReactNode } from "react";
import "./report.css";

/**
 * Print layout for the season report: no app header or footer, a grey "desk"
 * on screen and plain white paper when printing.
 *
 * `@page` and the background override are deliberately inline (not in
 * report.css) so they are removed when the user navigates away; a global
 * `@page { margin: 0 }` would otherwise leak into printing other app pages.
 */
export default function ReportLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-neutral-300 pb-[10mm] print:bg-white print:pb-0">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          body::before { display: none !important; }
        }
      `}</style>
      {children}
    </div>
  );
}
