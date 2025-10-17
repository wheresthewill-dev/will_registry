"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { capturePayPalOrder } from "@/services/paypalService"; // LEGACY: Keep for backward compatibility with existing orders
import { activatePayPalSubscription } from "@/services/paypalSubscriptionService"; // NEW: For subscription activation
import { useUserSubscription } from "@/app/utils/repo_services/hooks/user_subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Loader2 } from "lucide-react";
import { useUsers } from "@/app/utils/repo_services/hooks/user";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh: refreshSubscription } = useUserSubscription();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your payment...');
  const [details, setDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Add processing guard
  const [hasProcessed, setHasProcessed] = useState(false); // Add flag to prevent re-processing
  const processedRef = useRef(false); // useRef persists across re-renders
  const { getCurrentUser } = useUsers();

  useEffect(() => {
    const processPayment = async () => {
      // Triple guard: state, ref, and status check
      if (isProcessing || hasProcessed || processedRef.current) {
        console.log('⚠️ Payment processing already in progress or completed, skipping...');
        return;
      }

      // Additional check: if we already have a success status, don't process again
      if (status === 'success' || status === 'error') {
        console.log('⚠️ Payment already processed with status:', status);
        return;
      }

      try {
        setIsProcessing(true); // Set processing guard
        processedRef.current = true; // Set ref guard (persists across re-renders)
        
        console.log('🚀 Starting payment processing...');
        
        // Get PayPal order details from URL params
        if (!searchParams) {
          setStatus('error');
          setMessage('Missing search parameters');
          setHasProcessed(true); // Mark as processed even if error
          return;
        }

        const token = searchParams.get('token'); // PayPal order ID
        
        if (!token) {
          setStatus('error');
          setMessage('Missing payment information');
          setHasProcessed(true); // Mark as processed even if error
          return;
        }

        // Get pending upgrade details from localStorage (which should contain userId)
        const pendingUpgradeData = localStorage.getItem('pendingUpgrade');
        if (!pendingUpgradeData) {
          setStatus('error');
          setMessage('No pending upgrade found');
          setHasProcessed(true); // Mark as processed even if error
          return;
        }

        const pendingUpgrade = JSON.parse(pendingUpgradeData);
        
        console.log('Pending upgrade data:', pendingUpgrade);
        
        // Get user ID from localStorage first, fallback to getCurrentUser
        const payerId = pendingUpgrade.userId || getCurrentUser()?.id;
        
        console.log('Current user from hook:', getCurrentUser()?.id);
        console.log('User ID from localStorage:', pendingUpgrade.userId);
        console.log('Final payerId:', payerId);
        
        if (!payerId) {
          setStatus('error');
          setMessage('User authentication required. Please log in and try again.');
          setHasProcessed(true); // Mark as processed even if error
          return;
        }

        console.log('Processing payment for user:', payerId, 'with token:', token);
        
        // Determine if this is a legacy order or new subscription
        const isSubscriptionFlow = pendingUpgrade.type === 'subscription' && pendingUpgrade.subscriptionId;
        
        if (isSubscriptionFlow) {
          // NEW: Handle PayPal subscription activation
          console.log('Activating PayPal subscription...');
          const activationResult = await activatePayPalSubscription(pendingUpgrade.subscriptionId, payerId as string);
          
          if (activationResult.success) {
            console.log('Subscription activated successfully:', activationResult);
            
            setStatus('success');
            setMessage('Subscription activated successfully! Your plan has been upgraded.');
            setDetails({
              plan: activationResult.planLevel,
              amount: activationResult.planLevel === 'silver' ? '29.00' : 
                     activationResult.planLevel === 'gold' ? '99.99' : '199.99',
              transactionId: activationResult.subscriptionId,
              endDate: activationResult.endDate ? 
                new Date(activationResult.endDate).toLocaleDateString() : 
                'No expiration',
              isSubscription: activationResult.planLevel === 'silver',
              billingType: activationResult.planLevel === 'silver' ? 'Annual (cancel anytime)' :
                          activationResult.planLevel === 'gold' ? 'One-time (5-year access)' :
                          'One-time (10-year access)',
              nextBilling: activationResult.nextBillingDate ?
                new Date(activationResult.nextBillingDate).toLocaleDateString() :
                'No future billing'
            });
            
            // Clear pending upgrade
            localStorage.removeItem('pendingUpgrade');
            
            // Refresh subscription data
            try {
              refreshSubscription();
            } catch (refreshError) {
              console.warn('Failed to refresh subscription data:', refreshError);
            }
            
            setHasProcessed(true);
          } else {
            setStatus('error');
            setMessage(activationResult.error || 'Subscription activation failed. Please contact support.');
            setHasProcessed(true);
          }
        } else {
          // LEGACY: Handle old PayPal order capture
          console.log('⚠️ Processing legacy PayPal order (deprecated)...');
          const captureResult = await capturePayPalOrder(token as string, payerId as string);
          
          if (captureResult.success) { 
            console.log('Payment captured successfully:', captureResult);
            
            // The PayPal capture API already updated the subscription in the database
            // No need to call upgradeSubscription again
            setStatus('success');
            setMessage('Payment successful! Your subscription has been upgraded.');
            setDetails({
              plan: captureResult.plan,
              amount: captureResult.amount,
              transactionId: captureResult.transactionId,
              endDate: captureResult.subscriptionEndDate ? 
                new Date(captureResult.subscriptionEndDate).toLocaleDateString() : 
                'No expiration',
              wasAlreadyCaptured: captureResult.status === 'ALREADY_CAPTURED',
              isSubscription: false
            });
            
            // Clear pending upgrade
            localStorage.removeItem('pendingUpgrade');
            
            // Refresh subscription data to show updated status in other parts of the app
            // Call refreshSubscription manually instead of having it in useEffect dependencies
            try {
              refreshSubscription();
            } catch (refreshError) {
              console.warn('Failed to refresh subscription data:', refreshError);
            }
            
            setHasProcessed(true); // Mark as successfully processed
          } else {
            setStatus('error');
            // Handle specific error codes
            if (captureResult.code === 'MAX_ATTEMPTS_EXCEEDED') {
              setMessage('Payment session expired. Please create a new order from the subscription page.');
            } else if (captureResult.code === 'ORDER_NOT_PROCESSABLE') {
              setMessage('This payment order has expired. Please create a new order.');
            } else {
              setMessage(captureResult.error || 'Payment capture failed. Please try again.');
            }
            setHasProcessed(true); // Mark as processed even if error
          }
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        setHasProcessed(true); // Mark as processed even if error
      } finally {
        setIsProcessing(false); // Clear processing guard
      }
    };

    processPayment();
  }, [searchParams]); // Remove refreshSubscription from dependencies to prevent re-runs

  const handleReturnToDashboard = () => {
    router.push('/dashboard/subscription');
  };

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'processing' && (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'error' && (
              <X className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === 'processing' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {details && status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-green-800 mb-2">Subscription Details</h4>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium capitalize">{details.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Rate:</span>
                  <span className="font-medium">${details.amount}/year</span>
                </div>
                {details.billingType && (
                  <div className="flex justify-between">
                    <span>Billing:</span>
                    <span className="font-medium">{details.billingType}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Subscription ID:</span>
                  <span className="font-mono text-xs">{details.transactionId}</span>
                </div>
                {details.nextBilling && details.nextBilling !== 'N/A' && (
                  <div className="flex justify-between">
                    <span>Next Billing:</span>
                    <span className="font-medium">{details.nextBilling}</span>
                  </div>
                )}
                {details.endDate && details.endDate !== 'No expiration' && (
                  <div className="flex justify-between">
                    <span>Plan Ends:</span>
                    <span className="font-medium">{details.endDate}</span>
                  </div>
                )}
                {details.wasAlreadyCaptured && (
                  <div className="mt-2 text-xs text-green-600">
                    ℹ️ This payment was already processed successfully
                  </div>
                )}
              </div>
            </div>
          )}
          
          {status === 'error' && (message.includes('expired') || message.includes('create a new order')) && (
            <div className="flex flex-col gap-2">
              <Button onClick={handleReturnToDashboard} className="w-full">
                Create New Order
              </Button>
              <Button 
                onClick={handleReturnToDashboard}
                variant="outline"
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          )}
          
          {status !== 'error' || (!message.includes('expired') && !message.includes('create a new order')) ? (
            <Button 
              onClick={handleReturnToDashboard}
              className="w-full"
              disabled={status === 'processing'}
            >
              {status === 'processing' ? 'Please Wait...' : 'Return to Dashboard'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
