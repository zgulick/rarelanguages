'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f7f9fa' }}>
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">⚠️</div>
        <h1 className="heading-2 mb-4">Something went wrong</h1>
        <p className="body-text mb-8">
          We hit an unexpected error loading this page. Trying again usually helps.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary px-6 py-3">
            Try again
          </button>
          <Link href="/" className="btn-ghost px-6 py-3 inline-flex items-center justify-center">
            Back to languages
          </Link>
        </div>
      </div>
    </div>
  );
}
