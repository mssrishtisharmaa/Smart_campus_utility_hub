"use client";
import { ErrorState } from "@/components/ui";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="Something interrupted this page. Your saved records have not been removed."
      retry={reset}
    />
  );
}
