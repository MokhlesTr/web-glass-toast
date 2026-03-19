import { useEffect, useRef, useState } from "react";
import { toast as toastApi } from "./toastStore";
import type { ToastRecord, ToastType } from "./toastTypes";

interface ToastProps {
  toast: ToastRecord;
  visualIndex: number;
  onDismiss: () => void;
}

interface ToastTheme {
  accent: string;
  accentSoft: string;
  gradient: string;
}

type DragIntent = "pending" | "horizontal" | "vertical";

const DRAG_DEADZONE = 8;
const SWIPE_DISMISS_THRESHOLD = 120;
const SWIPE_EXIT_DISTANCE = 220;

const TOAST_THEME: Record<ToastType, ToastTheme> = {
  success: {
    accent: "#67f38a",
    accentSoft: "rgba(103, 243, 138, 0.44)",
    gradient:
      "linear-gradient(135deg, rgba(0, 200, 83, 0.72), rgba(100, 221, 23, 0.58))",
  },
  error: {
    accent: "#ff8f95",
    accentSoft: "rgba(255, 143, 149, 0.44)",
    gradient:
      "linear-gradient(135deg, rgba(255, 82, 82, 0.76), rgba(255, 23, 68, 0.58))",
  },
  info: {
    accent: "#7bdfff",
    accentSoft: "rgba(123, 223, 255, 0.42)",
    gradient:
      "linear-gradient(135deg, rgba(33, 150, 243, 0.76), rgba(0, 188, 212, 0.54))",
  },
  warning: {
    accent: "#ffc27a",
    accentSoft: "rgba(255, 194, 122, 0.46)",
    gradient:
      "linear-gradient(135deg, rgba(255, 152, 0, 0.78), rgba(255, 87, 34, 0.56))",
  },
  loading: {
    accent: "#b7beff",
    accentSoft: "rgba(183, 190, 255, 0.38)",
    gradient:
      "linear-gradient(135deg, rgba(126, 144, 255, 0.66), rgba(95, 110, 255, 0.38))",
  },
  custom: {
    accent: "#f1f2ff",
    accentSoft: "rgba(241, 242, 255, 0.28)",
    gradient:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(202, 214, 255, 0.14))",
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case "success":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 7L10 17l-5-5" />
        </svg>
      );
    case "error":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 8l8 8M16 8l-8 8" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l9 16H3L12 3z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "loading":
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="toast-icon-spinner"
        >
          <path d="M12 3a9 9 0 109 9" />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 8h.01" />
          <path d="M11 12h1v5h1" />
          <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      );
  }
};

export function Toast({ toast, visualIndex, onDismiss }: ToastProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const dragStartRef = useRef(0);
  const dragStartYRef = useRef(0);
  const draggingRef = useRef(false);
  const dragIntentRef = useRef<DragIntent>("pending");

  const [dragX, setDragX] = useState(0);
  const [swipeExitX, setSwipeExitX] = useState(0);
  const [isSingleLine, setIsSingleLine] = useState(false);

  const theme = TOAST_THEME[toast.type];
  const stackScale = clamp(1 - visualIndex * 0.04, 0.88, 1);
  const dragOpacity = clamp(1 - Math.abs(dragX) / 260, 0.42, 1);

  useEffect(() => {
    const progressElement = progressRef.current;

    if (!progressElement) {
      return;
    }

    if (toast.duration <= 0) {
      progressElement.style.transition = "none";
      progressElement.style.width = "100%";
      return;
    }

    const nextWidth = `${(toast.remaining / toast.duration) * 100}%`;

    progressElement.style.transition = "none";
    progressElement.style.width = nextWidth;

    if (toast.paused || toast.phase === "exiting") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      progressElement.style.transition = `width ${toast.remaining}ms linear`;
      progressElement.style.width = "0%";
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    toast.duration,
    toast.paused,
    toast.phase,
    toast.remaining,
    toast.updatedAt,
  ]);

  useEffect(() => {
    const messageElement = messageRef.current;

    if (!messageElement) {
      return;
    }

    const updateLineState = () => {
      const computedStyle = window.getComputedStyle(messageElement);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight);
      const height = messageElement.getBoundingClientRect().height;

      setIsSingleLine(height <= lineHeight * 1.35);
    };

    updateLineState();

    const resizeObserver = new ResizeObserver(updateLineState);
    resizeObserver.observe(messageElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [toast.message]);

  const handlePointerDown: React.PointerEventHandler<
    HTMLDivElement
  > = event => {
    if (toast.phase === "exiting") {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    draggingRef.current = true;
    dragStartRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragIntentRef.current = "pending";
    toastApi.pause(toast.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<
    HTMLDivElement
  > = event => {
    if (!draggingRef.current || toast.phase === "exiting") {
      return;
    }

    const deltaX = event.clientX - dragStartRef.current;
    const deltaY = event.clientY - dragStartYRef.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (dragIntentRef.current === "pending") {
      if (absDeltaX < DRAG_DEADZONE && absDeltaY < DRAG_DEADZONE) {
        return;
      }

      dragIntentRef.current = absDeltaX > absDeltaY ? "horizontal" : "vertical";
    }

    if (dragIntentRef.current !== "horizontal") {
      return;
    }

    setDragX(clamp(deltaX, -260, 260));
  };

  const handlePointerEnd: React.PointerEventHandler<HTMLDivElement> = event => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    dragIntentRef.current = "pending";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(dragX) > SWIPE_DISMISS_THRESHOLD) {
      setSwipeExitX(Math.sign(dragX) * SWIPE_EXIT_DISTANCE);
      setDragX(0);
      onDismiss();
      return;
    }

    setDragX(0);
    setSwipeExitX(0);
    toastApi.resume(toast.id);
  };

  const handlePointerCaptureLost: React.PointerEventHandler<
    HTMLDivElement
  > = () => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    dragIntentRef.current = "pending";
    setDragX(0);
    setSwipeExitX(0);
    toastApi.resume(toast.id);
  };

  const handleMouseEnter = () => {
    if (!draggingRef.current) {
      toastApi.pause(toast.id);
    }
  };

  const handleMouseLeave = () => {
    if (!draggingRef.current) {
      toastApi.resume(toast.id);
    }
  };

  const handleFocus = () => {
    if (!draggingRef.current) {
      toastApi.pause(toast.id);
    }
  };

  const handleBlur = () => {
    if (!draggingRef.current) {
      toastApi.resume(toast.id);
    }
  };

  return (
    <article
      className="toast-card"
      data-phase={toast.phase}
      data-gradient={toast.gradient}
      data-persistent={toast.duration <= 0}
      data-dismissible={toast.dismissible}
      data-single-line={isSingleLine}
      data-has-action={Boolean(toast.action)}
      data-with-icon={toast.withIcon}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerCaptureLost}
      role="status"
      aria-live="polite"
      style={
        {
          "--toast-accent": toast.accentColor ?? theme.accent,
          "--toast-accent-soft": toast.accentColor
            ? `color-mix(in srgb, ${toast.accentColor} 44%, transparent)`
            : theme.accentSoft,
          "--toast-surface-bg": toast.backgroundColor,
          "--toast-text-primary": toast.textColor,
          "--toast-gradient": theme.gradient,
          "--stack-scale": `${stackScale}`,
          "--drag-x": `${dragX}px`,
          "--swipe-exit-x": `${swipeExitX}px`,
          opacity: toast.phase === "exiting" ? undefined : dragOpacity,
        } as React.CSSProperties
      }
    >
      <div className="toast-glow" aria-hidden="true" />
      <div className="toast-main">
        {toast.withIcon && (
          <div className="toast-icon-shell">
            {toast.icon ?? <ToastIcon type={toast.type} />}
          </div>
        )}

        <div className="toast-copy">
          <p ref={messageRef} className="toast-message">
            {toast.message}
          </p>
        </div>

        {(toast.action || toast.dismissible) && (
          <div
            className="toast-side-actions"
            onPointerDown={e => e.stopPropagation()}
            onPointerMove={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
            onPointerCancel={e => e.stopPropagation()}
          >
            {toast.action ? (
              <button
                type="button"
                className="toast-action"
                onClick={event => {
                  event.stopPropagation();
                  toast.action?.onClick();
                  onDismiss();
                }}
              >
                {toast.action.label}
              </button>
            ) : null}

            {toast.dismissible ? (
              <button
                type="button"
                className="toast-close"
                onClick={event => {
                  event.stopPropagation();
                  onDismiss();
                }}
                aria-label="Dismiss notification"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8 8l8 8M16 8l-8 8" />
                </svg>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {toast.withProgressLine && (
        <div className="toast-progress-track" aria-hidden="true">
          <div
            ref={progressRef}
            className={`toast-progress-bar ${toast.duration <= 0 ? "is-indeterminate" : ""}`}
          />
        </div>
      )}
    </article>
  );
}
