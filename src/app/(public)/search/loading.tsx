export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="h-7 w-56 animate-pulse rounded-full bg-sb-border" />

      <div className="mt-4 h-10 w-full animate-pulse rounded-full bg-sb-border" />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl bg-sb-border"
          />
        ))}
      </div>
    </main>
  );
}
