type StarRatingProps = {
  score: number | null;
  reviewCount: number;
};

export function StarRating({ score, reviewCount }: StarRatingProps) {
  if (score === null) {
    return <p className="text-sm text-neutral-500">Sin reseñas todavía</p>;
  }

  const rounded = Math.round(score);

  return (
    <div className="flex items-center gap-1 text-sm">
      <span aria-hidden="true" className="text-amber-500">
        {"★".repeat(rounded)}
        {"☆".repeat(5 - rounded)}
      </span>
      <span className="text-neutral-600">
        {score.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}
