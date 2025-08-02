'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BypassPage() {
  const router = useRouter();

  const proceedToApp = () => {
    // Set a flag in localStorage to bypass initialization
    localStorage.setItem('bypass-initialization', 'true');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">BM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Development Bypass</h1>
          <p className="text-gray-600 mt-2">Skip initialization and go directly to the app</p>
        </div>

        <div className="space-y-4">
          <Button onClick={proceedToApp} className="w-full" size="lg">
            Bypass Setup & Continue
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              This will skip Google Sheets initialization for development purposes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}