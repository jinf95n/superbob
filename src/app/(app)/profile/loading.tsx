export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
      <div className="h-8 w-40 animate-pulse rounded-full bg-sb-border" />

      <div className="mt-6 flex flex-col gap-4">
        <div className="h-24 animate-pulse rounded-2xl bg-sb-border" />
        <div className="h-28 animate-pulse rounded-2xl bg-sb-border" />
        <div className="h-16 animate-pulse rounded-2xl bg-sb-border" />
        <div className="h-20 animate-pulse rounded-2xl bg-sb-border" />
        <div className="h-16 animate-pulse rounded-2xl bg-sb-border" />
      </div>
    </main>
  );
}
