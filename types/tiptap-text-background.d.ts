declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textBackgroundColor: {
      /** Background colour behind selected text (span), distinct from highlight mark. */
      setTextBackgroundColor: (color: string) => ReturnType;
      unsetTextBackgroundColor: () => ReturnType;
    };
  }
}

export {};
