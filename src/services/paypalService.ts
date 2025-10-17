/**
 * PayPal Service (DEPRECATED)
 * @deprecated Use paypalSubscriptionService.ts instead
 * 
 * This service uses the old PayPal Orders API for one-time payments.
 * It has been replaced by PayPal Subscriptions API for proper recurring billing.
 * 
 * Migration path:
 * - createPayPalOrder() -> createPayPalSubscription()
 * - capturePayPalOrder() -> activatePayPalSubscription()
 * 
 * This file is kept for backward compatibility and will be removed in a future version.
 */

export interface PayPalOrder {
  orderId: string;
  approvalUrl: string;
  plan: string;
  amount: number;
}

export interface PayPalCaptureResult {
  success: boolean;
  transactionId?: string;
  plan?: string;
  amount?: string;
  subscriptionEndDate?: string;
  status?: string;
  message?: string;
  error?: string;
  code?: string;
  suggestion?: string;
}

// Create PayPal order
export async function createPayPalOrder(plan: string, amount: number): Promise<PayPalOrder> {
  try {
    console.log('🔄 Creating PayPal order...', { plan, amount });
    
    const response = await fetch('/api/payments/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan,
        amount,
        currency: 'USD',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ PayPal order creation failed:', error);
      throw new Error(error.error || 'Failed to create PayPal order');
    }

    const data = await response.json();
    console.log('✅ PayPal order created:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'PayPal order creation failed');
    }

    return {
      orderId: data.orderId,
      approvalUrl: data.approvalUrl,
      plan,
      amount,
    };
  } catch (error) {
    console.error('❌ Create PayPal order failed:', error);
    throw error;
  }
}

// Capture PayPal payment
export async function capturePayPalOrder(orderId: string, userId: string): Promise<PayPalCaptureResult> {
  try {
    console.log('🔄 Capturing PayPal order...', { orderId, userId });
    
    const response = await fetch('/api/payments/paypal/capture-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        userId,
      }),
    });

    const data = await response.json();
    console.log('📥 PayPal capture response:', data);
    
    if (!response.ok) {
      console.error('❌ PayPal capture HTTP error:', { status: response.status, data });
      // Return error details from the API response
      return {
        success: false,
        error: data.error || 'Failed to capture PayPal payment',
        code: data.code,
        suggestion: data.suggestion,
        message: data.message
      };
    }

    if (!data.success) {
      console.error('❌ PayPal capture failed:', data);
      return {
        success: false,
        error: data.error || 'PayPal payment capture failed',
        code: data.code,
        suggestion: data.suggestion
      };
    }

    console.log('✅ PayPal payment captured successfully:', data);
    return {
      success: true,
      transactionId: data.transactionId,
      plan: data.plan,
      amount: data.amount,
      subscriptionEndDate: data.subscriptionEndDate,
      status: data.status,
      message: data.message
    };
  } catch (error) {
    console.error('❌ Capture PayPal payment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      suggestion: 'Please check your connection and try again'
    };
  }
}

// Get plan pricing
export function getPlanPricing(plan: string): number {
  const pricing: Record<string, number> = {
    bronze: 0,
    silver: 29,
    gold: 99,
    platinum: 199,
  };

  return pricing[plan.toLowerCase()] || 0;
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Open PayPal checkout
export function openPayPalCheckout(approvalUrl: string): void {
  // Open PayPal in a new window
  const popup = window.open(
    approvalUrl,
    'paypal-checkout',
    'width=600,height=700,scrollbars=yes,resizable=yes'
  );

  if (!popup) {
    // Fallback: redirect in the same window
    window.location.href = approvalUrl;
  }
}
