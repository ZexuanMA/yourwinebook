import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-6">🔍</p>
      <h1 className="text-2xl font-semibold text-text mb-3">Page Not Found</h1>
      <p className="text-sm text-text-sub max-w-md mb-8">
        The page you&apos;re looking for may have been removed or doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
