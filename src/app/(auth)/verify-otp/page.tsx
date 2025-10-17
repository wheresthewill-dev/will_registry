"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Shield } from 'lucide-react';
import { Suspense } from 'react';
import { useOTPVerification } from '@/hooks/use-otp-verification';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';

  const {
    otpCode,
    setOtpCode,
    loading,
    error,
    success,
    resending,
    verifyOTP,
    resendOTP,
  } = useOTPVerification({ email });

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOTP();
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  if (!email) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-semibold">Verify Your Identity</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to your email address
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Mail className="h-4 w-4" />
              <span className="truncate">{email}</span>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                required
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="mt-1 text-sm text-gray-500 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="flex justify-between items-center w-full text-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToLogin}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resendOTP}
                disabled={resending}
                className="text-blue-600 hover:text-blue-700"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
