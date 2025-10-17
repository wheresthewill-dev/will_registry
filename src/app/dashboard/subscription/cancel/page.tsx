"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function SubscriptionCancelPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any pending upgrade data
    localStorage.removeItem('pendingUpgrade');
  }, []);

  const handleReturnToDashboard = () => {
    router.push('/dashboard/subscription');
  };

  const handleTryAgain = () => {
    router.push('/dashboard/subscription');
  };

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <X className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle className="text-xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your payment was cancelled. No charges were made to your account.
          </p>
          
          <p className="text-sm text-gray-500">
            You can try again anytime or continue with your current subscription plan.
          </p>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleTryAgain} className="w-full">
              Try Again
            </Button>
            <Button 
              onClick={handleReturnToDashboard}
              variant="outline"
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
