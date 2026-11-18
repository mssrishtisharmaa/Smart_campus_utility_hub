import { z } from "zod";
import { route, apiUser, ApiError } from "@/lib/security";
import {
  collections,
  listRecords,
  saveRecord,
  deleteRecord,
  readNotification,
} from "@/lib/repository";
import { reportSchema, placeSchema } from "@/lib/validation";
const schema = z.object({
  id: z.string().max(100).optional(),
  payload: z.record(z.string(), z.unknown()),
});
export async function GET(
  req: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  return route(async () => {
    const user = await apiUser(req);
    const kind = z.enum(collections).parse((await params).kind);
    return listRecords(
      user,
      kind,
      new URL(req.url).searchParams.get("admin") === "true",
    );
  });
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  return route(async () => {
    const user = await apiUser(req);
    const kind = z.enum(collections).parse((await params).kind);
    const { id, payload } = schema.parse(await req.json());
    if (JSON.stringify(payload).length > 150000)
      throw new ApiError(413, "This record is too large.");
    if (kind === "community_reports") {
      if (!id) {reportSchema.parse(payload);if(Date.parse(String(payload.observed_at))>Date.now()+300000)throw new ApiError(400,'Observation time cannot be in the future.');if(payload.photo_path&&!String(payload.photo_path).startsWith(`${user.id}/`))throw new ApiError(403,'Photo must belong to the current account.');}
      else if (user.role !== "admin")
        throw new ApiError(403, "Only an administrator can review a report.");
      else
        z.object({
          status: z.enum([
            "submitted",
            "under_review",
            "verified",
            "rejected",
            "duplicate",
          ]),
          reviewer_note: z.string().max(2000).optional(),
        }).parse(payload);
    }
    if (kind === "saved_locations") placeSchema.parse(payload);
    if (kind === "alerts") {
      if (user.role !== "admin")
        throw new ApiError(403, "Administrator role required.");
      z.object({
        title: z.string().min(5).max(200),
        description: z.string().min(10).max(3000),
        severity: z.enum([
          "Advisory",
          "Watch",
          "Alert",
          "Warning",
          "Emergency",
        ]),
        valid_from: z.iso.datetime(),
        valid_to: z.iso.datetime(),
        is_demo: z.literal(true),
        origin: z.literal("derived"),
        published: z.boolean(),
      })
        .refine(
          (x) => new Date(x.valid_to) > new Date(x.valid_from),
          "Expiry must follow start time.",
        )
        .parse(payload);
    }
    if (kind === "notifications") {
      if (!id) throw new ApiError(400, "Notification ID required.");
      await readNotification(user, id);
      return { ok: true };
    }
    return saveRecord(user, kind, payload, id);
  });
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  return route(async () => {
    const user = await apiUser(req);
    const kind = z.enum(collections).parse((await params).kind);
    const { id } = z
      .object({ id: z.string().min(1).max(100) })
      .parse(await req.json());
    await deleteRecord(user, kind, id);
    return { ok: true };
  });
}
