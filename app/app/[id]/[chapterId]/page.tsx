"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const MahinkApp = dynamic(() => import("@/components/mahink/MahinkApp"), { ssr: false });

export default function BookChapterPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = use(params);
  return <MahinkApp initialBookId={id} initialChapterId={chapterId} key={`${id}-${chapterId}`} />;
}
