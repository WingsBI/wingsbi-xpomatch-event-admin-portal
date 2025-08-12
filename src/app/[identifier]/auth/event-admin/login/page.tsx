'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EventAdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const identifier = params.identifier as string;

  // Hard redirect this legacy route to the unified base login `/${identifier}`
  useEffect(() => {
    if (identifier) {
      router.replace(`/${identifier}`);
    }
  }, [identifier, router]);

  // Render nothing; this page is deprecated
  return null;
}