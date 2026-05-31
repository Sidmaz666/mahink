"use client";

import type { Book, Theme } from "@/lib/types";
import { resolveChapterTitleStyle } from "@/lib/editorLayout";
import ChapterTitleBlock from "./ChapterTitleBlock";

interface Props {
  chapter: { id: string; title: string };
  onRename: (title: string) => void;
  book: Book;
  bookTheme: Theme;
  bodyFontSizePx: number;
}

export default function ChapterTitle({ chapter, onRename, book, bookTheme, bodyFontSizePx }: Props) {
  const titleStyle = resolveChapterTitleStyle(book);
  return (
    <ChapterTitleBlock
      chapterId={chapter.id}
      title={chapter.title}
      onRename={onRename}
      titleStyle={titleStyle}
      bookTheme={bookTheme}
      bodyFontSizePx={bodyFontSizePx}
      fontFamily="var(--ed-font)"
      heading="h2"
      textColor="var(--txt)"
    />
  );
}
