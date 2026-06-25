export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-sb-bg">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
        <div className="rounded-2xl bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-full bg-sb-border" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-5 w-40 animate-pulse rounded-lg bg-sb-border" />
              <div className="h-4 w-28 animate-pulse rounded-lg bg-sb-border" />
            </div>
          </div>

          <div className="mt-5 h-11 w-full animate-pulse rounded-full bg-sb-border sm:w-40" />
        </div>

        <div className="rounded-2xl bg-white p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-card bg-sb-border"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-sb-border"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
