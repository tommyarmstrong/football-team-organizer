import ReactMarkdown from "react-markdown";

/**
 * Renders a hand-written markdown slot. Typography lives in `report.css`
 * (`.report-prose`). Raw HTML in the markdown is ignored, not rendered.
 */
export function ReportMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="report-prose">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
