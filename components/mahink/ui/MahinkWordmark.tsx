interface Props {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}

export default function MahinkWordmark({ size = "md", className = "" }: Props) {
  const classes = ["mahink-wordmark", `mahink-wordmark-${size}`, className].filter(Boolean).join(" ");

  return (
    <span className={classes} aria-label="MahInk">
      <span className="mahink-wordmark-mah">Mah</span>
      <span className="mahink-wordmark-ink">Ink</span>
    </span>
  );
}
