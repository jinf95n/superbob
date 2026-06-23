export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ workRecordId: string }>;
}) {
  const { workRecordId } = await params;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Escribir reseña — {workRecordId}</h1>
    </main>
  );
}
