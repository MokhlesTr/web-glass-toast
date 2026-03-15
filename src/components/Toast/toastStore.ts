import type {
  PromiseToastMessages,
  ToastOptions,
  ToastRecord,
  ToastType,
  ToastUpdate,
} from "./toastTypes";

const DEFAULT_DURATION = 4000;
const EXIT_DURATION = 200;
const ENTRY_DELAY = 32;

let toasts: ToastRecord[] = [];

const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const exitTimers = new Map<string, ReturnType<typeof setTimeout>>();

const emit = () => {
  listeners.forEach(listener => listener());
};

const clearToastTimer = (id: string) => {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
};

const clearExitTimer = (id: string) => {
  const timer = exitTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    exitTimers.delete(id);
  }
};

const defaultDurationForType = (type: ToastType) => {
  if (type === "loading") {
    return 0;
  }

  return DEFAULT_DURATION;
};

const createToastId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const scheduleDismiss = (toast: ToastRecord) => {
  clearToastTimer(toast.id);

  if (toast.duration <= 0 || toast.paused || toast.phase === "exiting") {
    return;
  }

  timers.set(
    toast.id,
    window.setTimeout(() => {
      dismissToast(toast.id);
    }, toast.remaining),
  );
};

const removeToast = (id: string) => {
  clearToastTimer(id);
  clearExitTimer(id);
  toasts = toasts.filter(toast => toast.id !== id);
  emit();
};

const setToastPhase = (id: string, phase: ToastRecord["phase"]) => {
  let changed = false;

  toasts = toasts.map(toast => {
    if (toast.id !== id || toast.phase === phase) {
      return toast;
    }

    changed = true;

    return {
      ...toast,
      phase,
      updatedAt: Date.now(),
    };
  });

  if (changed) {
    emit();
  }
};

const addToast = (message: string, options: ToastOptions = {}) => {
  const type = options.type ?? "custom";
  const duration = options.duration ?? defaultDurationForType(type);
  const createdAt = Date.now();

  const toast: ToastRecord = {
    id: options.id ?? createToastId(),
    message,
    type,
    position: options.position ?? "top-right",
    duration,
    remaining: duration,
    phase: "entering",
    createdAt,
    startedAt: duration > 0 ? createdAt : null,
    paused: false,
    gradient: options.gradient ?? false,
    dismissible: options.dismissible ?? type !== "loading",
    withIcon: options.withIcon ?? true,
    withProgressLine: options.withProgressLine ?? true,
    backgroundColor: options.backgroundColor,
    textColor: options.textColor,
    accentColor: options.accentColor,
    icon: options.icon,
    action: options.action,
    updatedAt: createdAt,
  };

  toasts = [toast, ...toasts];
  emit();

  window.setTimeout(() => {
    setToastPhase(toast.id, "visible");
  }, ENTRY_DELAY);

  scheduleDismiss(toast);

  return toast.id;
};

const updateToast = (id: string, updates: ToastUpdate) => {
  const now = Date.now();
  let nextToast: ToastRecord | undefined;

  toasts = toasts.map(toast => {
    if (toast.id !== id) {
      return toast;
    }

    const nextType = updates.type ?? toast.type;
    const nextDuration = updates.duration ?? toast.duration;
    const nextPaused = nextDuration <= 0 ? false : toast.paused;
    const nextRemaining = updates.duration ?? toast.remaining;

    nextToast = {
      ...toast,
      ...updates,
      type: nextType,
      duration: nextDuration,
      remaining: nextRemaining,
      startedAt: nextDuration > 0 && !nextPaused ? now : null,
      paused: nextPaused,
      dismissible:
        updates.dismissible ??
        (updates.type === "loading" ? false : toast.dismissible),
      phase: toast.phase === "exiting" ? toast.phase : "visible",
      updatedAt: now,
    };

    return nextToast;
  });

  emit();

  if (nextToast) {
    scheduleDismiss(nextToast);
  }
};

const pauseToast = (id: string) => {
  const now = Date.now();
  let nextToast: ToastRecord | undefined;

  toasts = toasts.map(toast => {
    if (
      toast.id !== id ||
      toast.duration <= 0 ||
      toast.paused ||
      toast.phase === "exiting"
    ) {
      return toast;
    }

    const elapsed = toast.startedAt ? now - toast.startedAt : 0;
    nextToast = {
      ...toast,
      paused: true,
      remaining: Math.max(0, toast.remaining - elapsed),
      startedAt: null,
      updatedAt: now,
    };

    return nextToast;
  });

  if (nextToast) {
    clearToastTimer(id);
    emit();
  }
};

const resumeToast = (id: string) => {
  const now = Date.now();
  let nextToast: ToastRecord | undefined;

  toasts = toasts.map(toast => {
    if (
      toast.id !== id ||
      toast.duration <= 0 ||
      !toast.paused ||
      toast.phase === "exiting"
    ) {
      return toast;
    }

    nextToast = {
      ...toast,
      paused: false,
      startedAt: now,
      updatedAt: now,
    };

    return nextToast;
  });

  if (nextToast) {
    emit();
    scheduleDismiss(nextToast);
  }
};

const dismissToast = (id?: string) => {
  const targetIds = id
    ? [id]
    : toasts.filter(toast => toast.phase !== "exiting").map(toast => toast.id);

  if (!targetIds.length) {
    return;
  }

  const nextIds = new Set(targetIds);
  const now = Date.now();

  toasts = toasts.map(toast => {
    if (!nextIds.has(toast.id) || toast.phase === "exiting") {
      return toast;
    }

    clearToastTimer(toast.id);
    clearExitTimer(toast.id);

    exitTimers.set(
      toast.id,
      window.setTimeout(() => {
        removeToast(toast.id);
      }, EXIT_DURATION),
    );

    return {
      ...toast,
      phase: "exiting",
      paused: false,
      startedAt: null,
      updatedAt: now,
    };
  });

  emit();
};

const resolveMessage = <T>(
  resolver: string | ((value: T) => string),
  value: T,
) => {
  if (typeof resolver === "function") {
    return resolver(value);
  }

  return resolver;
};

type ToastApi = ((message: string, options?: ToastOptions) => string) & {
  success: (message: string, options?: Omit<ToastOptions, "type">) => string;
  error: (message: string, options?: Omit<ToastOptions, "type">) => string;
  info: (message: string, options?: Omit<ToastOptions, "type">) => string;
  warning: (message: string, options?: Omit<ToastOptions, "type">) => string;
  loading: (message: string, options?: Omit<ToastOptions, "type">) => string;
  custom: (message: string, options?: Omit<ToastOptions, "type">) => string;
  update: (id: string, updates: ToastUpdate) => void;
  dismiss: (id?: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  promise: <T>(
    promise: Promise<T>,
    messages: PromiseToastMessages<T>,
    options?: Omit<ToastOptions, "type" | "duration">,
  ) => Promise<T>;
};

const baseToast = (message: string, options?: ToastOptions) =>
  addToast(message, options);

export const toast = baseToast as ToastApi;

toast.success = (message, options) =>
  addToast(message, { ...options, type: "success" });
toast.error = (message, options) =>
  addToast(message, { ...options, type: "error" });
toast.info = (message, options) =>
  addToast(message, { ...options, type: "info" });
toast.warning = (message, options) =>
  addToast(message, { ...options, type: "warning" });
toast.loading = (message, options) =>
  addToast(message, { ...options, type: "loading" });
toast.custom = (message, options) =>
  addToast(message, { ...options, type: "custom" });
toast.update = updateToast;
toast.dismiss = dismissToast;
toast.pause = pauseToast;
toast.resume = resumeToast;
toast.promise = async <T>(
  promise: Promise<T>,
  messages: PromiseToastMessages<T>,
  options?: Omit<ToastOptions, "type" | "duration">,
) => {
  const id = addToast(messages.loading, {
    ...options,
    type: "loading",
    duration: 0,
    dismissible: false,
  });

  try {
    const value = await promise;

    updateToast(id, {
      message: resolveMessage(messages.success, value),
      type: "success",
      duration: DEFAULT_DURATION,
      dismissible: true,
    });

    return value;
  } catch (error) {
    updateToast(id, {
      message: resolveMessage(messages.error, error),
      type: "error",
      duration: DEFAULT_DURATION,
      dismissible: true,
    });

    throw error;
  }
};

export const toastStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => toasts,
};
