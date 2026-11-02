import { buildMatchPostcardPayload } from "@/lib/postcards/match-postcard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { data, error } = await buildMatchPostcardPayload(id);
  if (error || !data) {
    return Response.json({ error: error ?? "Not found" }, { status: 404 });
  }

  return Response.json({
    caption: data.caption,
    fileName: data.fileName,
    kind: data.kind,
  });
}
