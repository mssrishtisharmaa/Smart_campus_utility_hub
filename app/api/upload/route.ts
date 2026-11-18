import { apiUser, route, ApiError } from "@/lib/security";
import { serverClient } from "@/lib/supabase/server";
export async function POST(req: Request) {
  return route(async () => {
    const user = await apiUser(req);
    if (user.mode !== "supabase")
      throw new ApiError(
        503,
        "Photo uploads require connected private Supabase Storage. You can submit a text report.",
      );
    const form = await req.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new ApiError(
        400,
        "Choose a JPEG, PNG or WebP image smaller than 5 MB.",
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid =
      file.type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216
        : file.type === "image/png"
          ? bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78
          : new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
            new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    if (!valid)
      throw new ApiError(
        400,
        "Image contents do not match the selected format.",
      );
    const path = `${user.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    const { error } = await (
      await serverClient()
    ).storage
      .from("report-images")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return { path };
  });
}
