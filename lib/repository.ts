import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/local-db";
import { serverClient } from "@/lib/supabase/server";
import type { User, RecordItem } from "@/types";
import { isDemoAccount } from "@/lib/alerts";
export const collections = [
  "saved_locations",
  "farms",
  "alert_subscriptions",
  "notifications",
  "conversations",
  "generated_advisories",
  "community_reports",
  "feedback",
  "user_preferences",
  "alerts",
  "audit_logs",
] as const;
export type Collection = (typeof collections)[number];
const globalCollections: Collection[] = ["alerts", "audit_logs"];
export async function listRecords(
  user: User,
  kind: Collection,
  admin = false,
): Promise<RecordItem[]> {
  if (admin && user.role !== "admin")
    throw new Error("Administrator role required.");
  if (kind === "audit_logs" && user.role !== "admin")
    throw new Error("Administrator role required.");
  if (kind === 'conversations') admin=false;
  if (user.mode === "supabase") {
    const s = await serverClient();
    let q = s
      .from(kind)
      .select("id,user_id,payload,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (!globalCollections.includes(kind) && !admin)
      q = q.eq("user_id", user.id);
    if (kind === "alerts" && !admin) q = q.eq("is_demo", isDemoAccount(user));
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data as RecordItem[];
  }
  const rows = db()
    .prepare(
      `SELECT * FROM records WHERE kind=? ${globalCollections.includes(kind) || admin ? "" : "AND user_id=?"} ORDER BY created_at DESC`,
    )
    .all(
      ...(globalCollections.includes(kind) || admin ? [kind] : [kind, user.id]),
    );
  const result=rows.map((r) => ({
    ...r,
    payload: JSON.parse(String(r.payload)),
  })) as RecordItem[];
  return kind==='alerts'&&!admin?result.filter(r=>r.payload.is_demo===isDemoAccount(user)&&r.payload.published&&Date.parse(String(r.payload.valid_to))>Date.now()):result;
}
export async function saveRecord(
  user: User,
  kind: Collection,
  payload: Record<string, unknown>,
  id?: string,
): Promise<RecordItem> {
  if (kind === "audit_logs" || kind === "notifications")
    throw new Error("This collection accepts trusted system writes only.");
  if (kind === "alerts" && user.role !== "admin")
    throw new Error("Administrator role required.");
  const row = {
    id: id || randomUUID(),
    user_id: user.id,
    payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (user.mode === "supabase") {
    const s = await serverClient();
    const q = id
      ? s
          .from(kind)
          .update({ payload, updated_at: row.updated_at })
          .eq("id", id)
      : s.from(kind).insert(row);
    const { data, error } = await q
      .select("id,user_id,payload,created_at,updated_at")
      .single();
    if (error) throw new Error(error.message);
    return data as RecordItem;
  }
  const sql = db();
  if (id) {
    const existing = sql
      .prepare("SELECT * FROM records WHERE id=? AND kind=?")
      .get(id, kind);
    if (!existing) throw new Error("Record not found.");
    if (
      existing.user_id !== user.id &&
      !(user.role === "admin" && ["alerts", "community_reports"].includes(kind))
    )
      throw new Error("Access denied.");
    row.user_id = String(existing.user_id);
    row.created_at = String(existing.created_at);
    sql
      .prepare(
        "UPDATE records SET payload=?,updated_at=? WHERE id=? AND kind=?",
      )
      .run(JSON.stringify(payload), row.updated_at, id, kind);
  } else
    sql
      .prepare("INSERT INTO records VALUES(?,?,?,?,?,?)")
      .run(
        row.id,
        kind,
        row.user_id,
        JSON.stringify(payload),
        row.created_at,
        row.updated_at,
      );
  if (user.role === "admin" && ["alerts", "community_reports"].includes(kind)) {
    sql
      .prepare("INSERT INTO records VALUES(?,?,?,?,?,?)")
      .run(
        randomUUID(),
        "audit_logs",
        user.id,
        JSON.stringify({
          action: id ? "update" : "create",
          entity: kind,
          entity_id: row.id,
          actor: user.email,
          after: payload,
        }),
        row.updated_at,
        row.updated_at,
      );
  }
  return row;
}
export async function deleteRecord(user: User, kind: Collection, id: string) {
  if (
    ["alerts", "audit_logs", "notifications", "community_reports"].includes(
      kind,
    )
  )
    throw new Error("Deletion is not permitted for this collection.");
  if (user.mode === "supabase") {
    const { error } = await (
      await serverClient()
    )
      .from(kind)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    return;
  }
  db()
    .prepare("DELETE FROM records WHERE id=? AND kind=? AND user_id=?")
    .run(id, kind, user.id);
}
export async function readNotification(user: User, id: string) {
  if (user.mode === "supabase") {
    const s = await serverClient();
    const { data, error } = await s
      .from("notifications")
      .select("payload")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error) throw new Error(error.message);
    const result = await s
      .from("notifications")
      .update({
        payload: {
          ...data.payload,
          status: "read",
          read_at: new Date().toISOString(),
        },
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (result.error) throw new Error(result.error.message);
  } else {
    const r = db()
      .prepare(
        "SELECT payload FROM records WHERE id=? AND user_id=? AND kind='notifications'",
      )
      .get(id, user.id);
    if (r)
      db()
        .prepare("UPDATE records SET payload=? WHERE id=? AND user_id=?")
        .run(
          JSON.stringify({ ...JSON.parse(String(r.payload)), status: "read" }),
          id,
          user.id,
        );
  }
}
