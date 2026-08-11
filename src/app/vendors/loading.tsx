export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-8 w-64 rounded-lg bg-charcoal-100" />
      <div className="mt-3 h-4 w-96 rounded bg-charcoal-100" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-charcoal-100" />
        ))}
      </div>
    </div>
  );
}
