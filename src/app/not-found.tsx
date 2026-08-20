import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f7f9fa' }}>
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🧭</div>
        <h1 className="heading-2 mb-4">Page not found</h1>
        <p className="body-text mb-8">
          That page doesn&apos;t exist. It may have moved, or the link may be out of date.
        </p>
        <Link href="/" className="btn-primary px-6 py-3 inline-flex items-center">
          Back to languages
        </Link>
      </div>
    </div>
  );
}
