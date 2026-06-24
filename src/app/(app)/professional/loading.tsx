export default function ProfessionalLoading() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
      <div className="h-8 w-64 animate-pulse rounded-full bg-sb-border" />
      <div className="mt-2 h-4 w-48 animate-pulse rounded-full bg-sb-border" />

      <div className="mt-6 flex flex-col gap-4">
        <div className="h-40 animate-pulse rounded-2xl bg-sb-border" />
        <div className="h-40 animate-pulse rounded-2xl bg-sb-border" />
        <div className="h-12 animate-pulse rounded-full bg-sb-border" />
      </div>
    </main>
  );
}
