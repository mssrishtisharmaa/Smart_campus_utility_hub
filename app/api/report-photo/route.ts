import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiUser, ApiError, route } from '@/lib/security';
import { serverClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  let target: string | undefined;
  const result = await route(async () => {
    const user = await apiUser(req);
    if (user.mode !== 'supabase') throw new ApiError(404, 'No hosted photo is available.');
    const id = z.uuid().parse(new URL(req.url).searchParams.get('id'));
    const client = await serverClient();
    const { data, error } = await client.from('community_reports').select('user_id,payload').eq('id', id).single();
    if (error || !data || (data.user_id !== user.id && user.role !== 'admin')) throw new ApiError(404, 'Photo not found.');
    const path = data.payload.photo_path;
    if (typeof path !== 'string' || !path.startsWith(`${data.user_id}/`)) throw new ApiError(404, 'Photo not found.');
    const signed = await client.storage.from('report-images').createSignedUrl(path, 60);
    if (signed.error) throw new ApiError(404, 'Photo unavailable.');
    target = signed.data.signedUrl;
    return { ok: true };
  });
  if (!target) return result;
  return NextResponse.redirect(target, { status: 307, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
