import type { ReactNode } from "react";

export type ToastType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "loading"
  | "custom";

export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

export type ToastPhase = "entering" | "visible" | "exiting";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
  gradient?: boolean;
  dismissible?: boolean;
  withIcon?: boolean;
  withProgressLine?: boolean;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  icon?: ReactNode;
  action?: ToastAction;
}

export interface ToastRecord {
  id: string;
  message: string;
  type: ToastType;
  position: ToastPosition;
  duration: number;
  remaining: number;
  phase: ToastPhase;
  createdAt: number;
  startedAt: number | null;
  paused: boolean;
  gradient: boolean;
  dismissible: boolean;
  withIcon: boolean;
  withProgressLine: boolean;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  icon?: ReactNode;
  action?: ToastAction;
  updatedAt: number;
}

export interface ToastUpdate {
  message?: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
  gradient?: boolean;
  dismissible?: boolean;
  withIcon?: boolean;
  withProgressLine?: boolean;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  icon?: ReactNode;
  action?: ToastAction;
}

export interface PromiseToastMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
}
