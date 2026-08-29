import { folderRepo } from "@/lib/repository";
import { folderCreateInputSchema, folderUpdateInputSchema } from "@/lib/types";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  const { error, user } = await requireAuth();
  if (error || !user) return error;
  return ok(await folderRepo.list(user.id));
}

export async function POST(req: Request) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const limited = guard(req, "folders:create");
  if (limited) return limited;

  const parsed = await parseBody(req, folderCreateInputSchema);
  if ("res" in parsed) return parsed.res;

  try {
    const folder = await folderRepo.create(parsed.data, user.id);
    return ok(folder, 201);
  } catch (err) {
    console.error("Folder creation error:", err);
    return fail("Failed to create folder", 500);
  }
}

export async function PATCH(req: Request) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const url = new URL(req.url);
  const folderId = url.searchParams.get("id");
  if (!folderId) return fail("Folder ID required", 400);

  const parsed = await parseBody(req, folderUpdateInputSchema);
  if ("res" in parsed) return parsed.res;

  const success = await folderRepo.update(folderId, user.id, parsed.data);
  if (!success) return fail("Folder not found or update failed", 404);

  return ok({ success: true });
}

export async function DELETE(req: Request) {
  const { error, user } = await requireAuth();
  if (error || !user) return error;

  const url = new URL(req.url);
  const folderId = url.searchParams.get("id");
  if (!folderId) return fail("Folder ID required", 400);

  const success = await folderRepo.remove(folderId, user.id);
  if (!success) return fail("Folder not found or delete failed", 404);

  return ok({ success: true });
}
