type StarRatingProps = {
  score: number | null;
  reviewCount: number;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

export function StarRating({ score, reviewCount, size = "sm" }: StarRatingProps) {
  if (score === null) {
    return <p className="text-sm text-sb-muted">Sin reseñas todavía</p>;
  }

  const rounded = Math.round(score);

  return (
    <div className={`flex items-center gap-1 ${SIZE_CLASSES[size]}`}>
      <span aria-hidden="true" className="text-sb-orange">
        {"★".repeat(rounded)}
        {"☆".repeat(5 - rounded)}
      </span>
      <span className="text-sm font-medium text-sb-muted">
        {score.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}
