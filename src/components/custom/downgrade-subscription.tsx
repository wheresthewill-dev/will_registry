import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { 
    downgradePayPalSubscription, 
    confirmDowngradeWithRestrictions,
    openPayPalCheckout 
} from '@/services/paypalSubscriptionService';
import { SUBSCRIPTION_TIERS, SubscriptionLevel } from '@/app/utils/repo_services/interfaces/user_subscription';

interface DowngradeSubscriptionProps {
    currentPlan: SubscriptionLevel;
    targetPlan: SubscriptionLevel;
    userId: string;
    currentUsage: {
        emergencyContacts: number;
        representatives: number;
        documents: number;
    };
    onDowngradeComplete?: () => void;
    onCancel?: () => void;
}

interface DowngradeAnalysis {
    currentPlan: string;
    targetPlan: string;
    currentUsage: any;
    targetLimits: any;
    violations: string[];
    hasViolations: boolean;
    potentialRefund?: number;
    strategy: string;
    message: string;
    restrictionMessage?: string;
}

export function DowngradeSubscription({
    currentPlan,
    targetPlan,
    userId,
    currentUsage,
    onDowngradeComplete,
    onCancel
}: DowngradeSubscriptionProps) {
    const [analysis, setAnalysis] = useState<DowngradeAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const targetTier = SUBSCRIPTION_TIERS[targetPlan];
    const currentTier = SUBSCRIPTION_TIERS[currentPlan];

    // Analyze downgrade feasibility
    const analyzeDowngrade = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await downgradePayPalSubscription(currentPlan, targetPlan, userId);
            
            if (result.success && result.strategy) {
                setAnalysis({
                    currentPlan,
                    targetPlan,
                    currentUsage,
                    targetLimits: targetTier.limits,
                    violations: result.violations || [],
                    hasViolations: result.hasViolations || false,
                    potentialRefund: result.potentialRefund,
                    strategy: result.strategy,
                    message: result.message || '',
                    restrictionMessage: result.restrictionMessage
                });
            } else {
                setError(result.error || 'Failed to analyze downgrade');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze downgrade');
        } finally {
            setLoading(false);
        }
    };

    // Confirm downgrade with restrictions
    const handleConfirmDowngrade = async () => {
        if (!analysis) return;
        
        setProcessing(true);
        setError(null);

        try {
            const result = await confirmDowngradeWithRestrictions(currentPlan, targetPlan, userId);
            
            if (result.success) {
                if (result.nextStep === 'complete') {
                    // Downgrade to Bronze complete
                    onDowngradeComplete?.();
                } else if (result.nextStep === 'payment-required' && result.approvalUrl) {
                    // Need to complete payment for new plan
                    openPayPalCheckout(result.approvalUrl);
                }
            } else {
                setError(result.error || 'Failed to confirm downgrade');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to confirm downgrade');
        } finally {
            setProcessing(false);
        }
    };

    // Initialize analysis on component load
    React.useEffect(() => {
        analyzeDowngrade();
    }, [currentPlan, targetPlan, userId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Analyzing Downgrade...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        Downgrade Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={analyzeDowngrade} disabled={loading}>
                            Try Again
                        </Button>
                        <Button variant="ghost" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!analysis) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Downgrade from {currentTier.name} to {targetTier.name}
                </CardTitle>
                <CardDescription>
                    Review the impact of downgrading your subscription
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current vs Target Plan Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium mb-2">Current Plan: {currentTier.name}</h4>
                        <div className="text-sm space-y-1">
                            <div>Emergency Contacts: {currentUsage.emergencyContacts} / {currentTier.limits.emergencyContacts}</div>
                            <div>Representatives: {currentUsage.representatives} / {currentTier.limits.representatives}</div>
                            <div>Documents: {currentUsage.documents} / {currentTier.limits.documentsCount === -1 ? '∞' : currentTier.limits.documentsCount}</div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Target Plan: {targetTier.name}</h4>
                        <div className="text-sm space-y-1">
                            <div>Emergency Contacts: {targetTier.limits.emergencyContacts}</div>
                            <div>Representatives: {targetTier.limits.representatives}</div>
                            <div>Documents: {targetTier.limits.documentsCount === -1 ? '∞' : targetTier.limits.documentsCount}</div>
                        </div>
                    </div>
                </div>

                {/* Violations Warning */}
                {analysis.hasViolations && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="font-medium mb-2">You're over the limits for the {targetTier.name} plan:</div>
                            <ul className="list-disc list-inside space-y-1">
                                {analysis.violations.map((violation, index) => (
                                    <li key={index} className="text-sm">{violation}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Downgrade Message */}
                <Alert variant={analysis.hasViolations ? "default" : "default"}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        {analysis.message}
                        {analysis.restrictionMessage && (
                            <div className="mt-2 font-medium text-amber-600">
                                {analysis.restrictionMessage}
                            </div>
                        )}
                    </AlertDescription>
                </Alert>

                {/* Potential Refund */}
                {analysis.potentialRefund && analysis.potentialRefund > 0 && (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            You may be eligible for a refund credit of ${analysis.potentialRefund.toFixed(2)} 
                            for unused time on your current plan. This will be added to your wallet credits 
                            for future use.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                    <Button 
                        onClick={handleConfirmDowngrade} 
                        disabled={processing}
                        variant={analysis.hasViolations ? "destructive" : "default"}
                    >
                        {processing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </>
                        ) : (
                            analysis.hasViolations ? 
                                `Downgrade with Restrictions` : 
                                `Confirm Downgrade to ${targetTier.name}`
                        )}
                    </Button>
                    <Button variant="outline" onClick={onCancel} disabled={processing}>
                        Cancel
                    </Button>
                </div>

                {/* Fine Print */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>
                        • Your existing data will be preserved but you won't be able to add new items until you're within limits
                    </p>
                    <p>
                        • {targetPlan === 'bronze' ? 'Bronze plan is free forever' : `${targetTier.name} plan costs $${targetTier.price}${targetTier.duration ? ` ${targetTier.duration}` : ''}`}
                    </p>
                    {analysis.potentialRefund && (
                        <p>
                            • Refunds will be processed as wallet credits for future subscription payments
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
