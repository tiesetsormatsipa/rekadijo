export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-8 w-56 rounded-lg bg-charcoal-100" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-charcoal-100" />
        ))}
      </div>
    </div>
  );
}
