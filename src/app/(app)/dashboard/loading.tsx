export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded-full bg-sb-border" />

      <div className="mt-6 flex flex-col gap-4">
        <div className="h-32 animate-pulse rounded-2xl bg-sb-border" />
        <div className="h-24 animate-pulse rounded-2xl bg-sb-border" />
      </div>
    </main>
  );
}
