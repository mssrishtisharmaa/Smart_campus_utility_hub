import { Suspense } from "react";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { Loading } from "@/components/ui";
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatWorkspace />
    </Suspense>
  );
}
