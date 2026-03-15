import { useSyncExternalStore } from "react";
import { toast, toastStore } from "../components/Toast/toastStore";

export function useToast() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getSnapshot,
  );

  return {
    toasts,
    toast,
  };
}
