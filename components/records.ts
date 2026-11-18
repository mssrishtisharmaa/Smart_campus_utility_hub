"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, useApp } from "./providers";
import type { RecordItem } from "@/types";
export function useRecords(kind: string) {
  const client = useQueryClient();
  const { user, lowBandwidth } = useApp();
  const query = useQuery({
    queryKey: ["records", kind, user.id],
    queryFn: () => api<RecordItem[]>(`/api/records/${kind}`),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: lowBandwidth ? 300000 : 60000,
  });
  const save = useMutation({
    mutationFn: (v: { payload: Record<string, unknown>; id?: string }) =>
      api<RecordItem>(`/api/records/${kind}`, v),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["records", kind] });
      if (kind === "saved_locations" || kind === "alert_subscriptions") void client.invalidateQueries({queryKey:["alert-feed"]});
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/records/${kind}`, { id }, "DELETE"),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["records", kind] });
      if (kind === "saved_locations" || kind === "alert_subscriptions") void client.invalidateQueries({queryKey:["alert-feed"]});
    },
    onError: (e) => toast.error(e.message),
  });
  return { ...query, save, remove };
}
