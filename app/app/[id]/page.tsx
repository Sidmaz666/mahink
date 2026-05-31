"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const MahinkApp = dynamic(() => import("@/components/mahink/MahinkApp"), { ssr: false });

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <MahinkApp initialBookId={id} key={id} />;
}
