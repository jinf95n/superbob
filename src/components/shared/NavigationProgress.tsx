"use client";

import dynamic from "next/dynamic";

const ProgressBar = dynamic(
  () => import("./ProgressBar").then((mod) => mod.ProgressBar),
  { ssr: false },
);

export function NavigationProgress() {
  return <ProgressBar />;
}
