import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { Toast } from "./Toast";
import type { ToastPosition } from "./toastTypes";
import "./toastStyles.css";

const POSITIONS: ToastPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export function ToastContainer() {
  const { toast, toasts } = useToast();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);

  const getMobilePosition = (position: ToastPosition): ToastPosition => {
    if (position.startsWith("top")) {
      return "top-center";
    }

    return "bottom-center";
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateMobileState = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    updateMobileState(mediaQuery);
    mediaQuery.addEventListener("change", updateMobileState);

    return () => {
      mediaQuery.removeEventListener("change", updateMobileState);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || toasts.length === 0) {
        return;
      }

      toast.dismiss(toasts[0].id);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [toast, toasts]);

  const groupedToasts = POSITIONS.reduce<Record<ToastPosition, typeof toasts>>(
    (groups, position) => {
      groups[position] = [];
      return groups;
    },
    {
      "top-left": [],
      "top-center": [],
      "top-right": [],
      "bottom-left": [],
      "bottom-center": [],
      "bottom-right": [],
    },
  );

  toasts.forEach(item => {
    const targetPosition = isMobile
      ? getMobilePosition(item.position)
      : item.position;
    groupedToasts[targetPosition].push(item);
  });

  return POSITIONS.map(position => {
    const isBottomPosition = position.startsWith("bottom");
    const items = groupedToasts[position];

    if (items.length === 0) {
      return null;
    }

    const orderedItems = isBottomPosition ? [...items].reverse() : items;

    return (
      <div key={position} className={`toast-region toast-region--${position}`}>
        {orderedItems.map((item, index) => {
          const visualIndex = isBottomPosition
            ? orderedItems.length - 1 - index
            : index;

          return (
            <Toast
              key={item.id}
              toast={item}
              visualIndex={visualIndex}
              onDismiss={() => toast.dismiss(item.id)}
            />
          );
        })}
      </div>
    );
  });
}
