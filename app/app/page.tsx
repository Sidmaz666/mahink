"use client";

import dynamic from "next/dynamic";

// The entire app uses localStorage — disable SSR to avoid hydration mismatches.
const MahinkApp = dynamic(() => import("@/components/mahink/MahinkApp"), { ssr: false });

export default function DashPage() {
  return <MahinkApp />;
}
