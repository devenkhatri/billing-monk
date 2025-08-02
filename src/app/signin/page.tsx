'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { LoadingState } from '@/components/ui/loading';

export default function SignInRedirectPage() {
  useEffect(() => {
    // Automatically trigger Google sign-in
    signIn('google', { callbackUrl: '/' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingState size="lg" />
        <p className="mt-4 text-gray-600">Redirecting to Google sign-in...</p>
      </div>
    </div>
  );
}