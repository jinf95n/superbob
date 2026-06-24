"use client";

import { AppProgressBar } from "next-nprogress-bar";

export function ProgressBar() {
  return (
    <AppProgressBar
      height="3px"
      color="#1A6FE0"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
