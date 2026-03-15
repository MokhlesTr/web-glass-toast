# @tarmiz/web-glass-toast

Modern glassmorphism toast notifications for React.

[![Web Glass Toast Preview](https://image.thum.io/get/width/1400/https://web-glass-toast-documentation.vercel.app/)](https://web-glass-toast-documentation.vercel.app/)

- Live documentation: https://web-glass-toast-documentation.vercel.app/
- npm package: https://www.npmjs.com/package/@tarmiz/web-glass-toast

## Why Use It

- Stacked toast cards with depth and smooth transitions
- Hover pause and resume timers
- Swipe-to-dismiss interaction
- Promise lifecycle helper for loading/success/error flows
- Position control for top/bottom and left/center/right
- Action buttons and style customization options

## Installation

```bash
npm install @tarmiz/web-glass-toast
```

or

```bash
yarn add @tarmiz/web-glass-toast
```

## Step 1: Add The Container Once

Mount `ToastContainer` near your app root.

```tsx
import { ToastContainer } from "@tarmiz/web-glass-toast";
import "@tarmiz/web-glass-toast/style.css";

export function AppRoot() {
  return (
    <>
      {/* your app */}
      <ToastContainer />
    </>
  );
}
```

## Step 2: Trigger Toasts Anywhere

Use the `toast` API from buttons, forms, server actions, or async workflows.

```tsx
import { toast } from "@tarmiz/web-glass-toast";

export function SaveButton() {
  return <button onClick={() => toast.success("Project saved")}>Save</button>;
}
```

## Step 3: Use Built-In Variants

```ts
toast("Default message");
toast.success("Saved successfully");
toast.error("Something went wrong");
toast.info("New updates available");
toast.warning("Please review before continuing");
toast.loading("Uploading...");
```

## Step 4: Customize Behavior And Style

```ts
toast("File moved", {
  position: "bottom-right",
  duration: 5000,
  gradient: true,
  withIcon: true,
  withProgressLine: true,
  backgroundColor: "#101426",
  textColor: "#eef2ff",
  accentColor: "#67f38a",
  action: {
    label: "Undo",
    onClick: () => {
      // custom action
    },
  },
});
```

## Step 5: Handle Async Operations With `toast.promise`

```ts
await toast.promise(
  fetch("/api/project").then(r => r.json()),
  {
    loading: "Saving project...",
    success: "Project saved",
    error: "Save failed",
  },
);
```

You can also pass resolver functions for success/error messages.

```ts
await toast.promise(apiCall(), {
  loading: "Processing...",
  success: result => `Done: ${result.count} items`,
  error: error => `Error: ${String(error)}`,
});
```

## API Overview

### `toast(message, options?)`

Core function used by all variants.

### Variant helpers

- `toast.success(message, options?)`
- `toast.error(message, options?)`
- `toast.info(message, options?)`
- `toast.warning(message, options?)`
- `toast.loading(message, options?)`
- `toast.custom(message, options?)`

### State and lifecycle helpers

- `toast.update(id, updates)`
- `toast.dismiss(id?)`
- `toast.pause(id)`
- `toast.resume(id)`
- `toast.promise(promise, messages, options?)`

## Options Reference

```ts
type ToastOptions = {
  id?: string;
  type?: "success" | "error" | "info" | "warning" | "loading" | "custom";
  position?:
    | "top-right"
    | "top-left"
    | "top-center"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center";
  duration?: number; // 0 = persistent
  gradient?: boolean;
  dismissible?: boolean;
  withIcon?: boolean;
  withProgressLine?: boolean;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
};
```

## Full Example

```tsx
import { ToastContainer, toast } from "@tarmiz/web-glass-toast";
import "@tarmiz/web-glass-toast/style.css";

export function App() {
  const notify = () => {
    toast.success("Welcome back", {
      position: "top-right",
      action: {
        label: "Open",
        onClick: () => console.log("Open clicked"),
      },
    });
  };

  return (
    <>
      <button onClick={notify}>Show Toast</button>
      <ToastContainer />
    </>
  );
}
```

## Local Development

```bash
npm install
npm run build
npm run lint
```

## License

MIT - see [LICENSE](./LICENSE)
