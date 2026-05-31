declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    twoColumnBlock: {
      insertTwoColumnSection: () => ReturnType;
    };
  }
}

export {};
