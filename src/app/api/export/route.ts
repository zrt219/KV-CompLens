import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildExportArtifact, isExportReady, type ExportArtifactType } from "../../../../lib/pce/exportPackage";
import type { PceAnalysisSnapshot } from "../../../../lib/pce/runPcePipeline";
import type { SubjectProperty } from "../../../../lib/types";

export const runtime = "nodejs";

type ExportRequestBody = {
  type: ExportArtifactType;
  subject: SubjectProperty;
  snapshot: PceAnalysisSnapshot;
};

export async function POST(request: Request) {
  const body = await request.json() as Partial<ExportRequestBody>;

  if (!body.type || !body.subject || !body.snapshot) {
    return new Response("Missing export payload.", { status: 400 });
  }

  const snapshot = body.snapshot;

  if (!isExportReady(snapshot)) {
    return new Response("Analysis must run before export.", { status: 409 });
  }

  const artifact = buildExportArtifact(body.type, body.subject, snapshot);
  const bytes = typeof artifact.content === "string"
    ? new TextEncoder().encode(artifact.content)
    : artifact.content;

  const artifactDirectory = join(process.cwd(), "artifacts", "exports");
  await mkdir(artifactDirectory, { recursive: true });

  const artifactPath = join(artifactDirectory, artifact.fileName);
  await writeFile(artifactPath, bytes);

  return new Response(bytes.slice().buffer, {
    status: 200,
    headers: {
      "Content-Type": artifact.mimeType,
      "Content-Disposition": `attachment; filename=\"${artifact.fileName}\"`
    }
  });
}
