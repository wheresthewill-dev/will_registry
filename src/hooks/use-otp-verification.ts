"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabase/client';

interface UseOTPVerificationProps {
  email: string;
}

interface UseOTPVerificationReturn {
  otpCode: string;
  setOtpCode: (code: string) => void;
  loading: boolean;
  error: string;
  resending: boolean;
  success: string;
  verifyOTP: () => Promise<void>;
  resendOTP: () => Promise<void>;
}

export function useOTPVerification({ email }: UseOTPVerificationProps): UseOTPVerificationReturn {
  const router = useRouter();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);

  const verifyOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: otpCode,
          step: 'verify-otp'
        }),
      });

      const data = await response.json();

      console.log('OTP verification response:', data);

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.success) {
        console.log('OTP verification successful, handling authentication...', {
          hasActionLink: !!data.actionLink,
          hasSession: !!data.session,
          actionLink: data.actionLink
        });

        // Use the action link but handle it differently to avoid race conditions
        if (data.actionLink) {
          console.log('Processing action link for authentication...');

          // Parse the action link to extract tokens manually
          try {
            const actionUrl = new URL(data.actionLink);
            const token = actionUrl.searchParams.get('token');

            if (token) {
              console.log('Extracted token from action link, setting session...');

              // Use Supabase's verifyOtp method with the extracted token
              const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'recovery',
                options: {
                  redirectTo: new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL).toString()
                }
              });

              if (sessionError) {
                console.error('Session verification error:', sessionError);
                setError('Failed to establish session');
                return;
              }

              console.log('Session established successfully via token verification');

              // Small delay to ensure user context updates before redirect
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Use router.push for better state management
              router.push('/dashboard');
              return;
            }
          } catch (tokenError) {
            console.log('Token extraction failed, falling back to direct redirect');
          }

          // Fallback: Use direct redirect but with a delay
          console.log('Using direct action link redirect with delay...');
          setTimeout(() => {
            window.location.href = data.actionLink;
          }, 500);
          return;
        }

        // If session tokens are provided, try to set the session on the client
        if (data.session && data.session.access_token && data.session.refresh_token) {
          console.log('Setting session with tokens from server');

          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });

          if (sessionError) {
            console.error('Client session error:', sessionError);
            setError('Failed to establish session');
            return;
          }

          console.log('Session set successfully, redirecting to dashboard');
          // Use router.push instead of window.location to trigger React state updates
          router.push('/dashboard');
          return;
        }

        // Fallback: regular redirect
        console.log('Using fallback redirect to dashboard');
        window.location.href = '/dashboard';
        return;
      }

      // If we get here, something unexpected happened
      setError('Verification completed but redirect failed');

    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.success) {
        // Clear any existing OTP code
        setOtpCode('');
        // Show success message
        setSuccess('New verification code sent to your email!');
        setError('');
        console.log('OTP resent successfully to:', email);
      } else {
        setError('Failed to resend verification code');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Network error occurred while resending code');
    } finally {
      setResending(false);
    }
  };

  const handleOtpCodeChange = (code: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericCode = code.replace(/\D/g, '').slice(0, 6);
    setOtpCode(numericCode);

    // Clear error and success messages when user starts typing
    if (error) {
      setError('');
    }
    if (success) {
      setSuccess('');
    }
  };

  return {
    otpCode,
    setOtpCode: handleOtpCodeChange,
    loading,
    error,
    success,
    resending,
    verifyOTP,
    resendOTP,
  };
}
