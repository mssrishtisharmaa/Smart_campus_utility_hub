import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CommandCentre } from "@/components/admin/command-centre";
export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  await requireUser(true);
  const { section } = await params;
  const name = section?.join("/") || "";
  if (
    ![
      "",
      "alerts",
      "community-reports",
      "data-sources",
      "users",
      "audit-log",
      "system-health",
    ].includes(name)
  )
    notFound();
  return <CommandCentre section={name} />;
}
