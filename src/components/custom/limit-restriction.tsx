import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock, ArrowUp } from 'lucide-react';
import { SubscriptionLevel } from '@/app/utils/repo_services/interfaces/user_subscription';

interface LimitRestrictionProps {
    isOverLimit: boolean;
    violations?: Array<{ type: string; current: number; limit: number; violation: string }>;
    currentPlan: SubscriptionLevel;
    itemType: 'emergencyContact' | 'representative' | 'document';
    onUpgrade?: () => void;
    showUpgradeButton?: boolean;
}

const itemTypeLabels = {
    emergencyContact: 'Emergency Contact',
    representative: 'Authorised Representative',
    document: 'Document'
};

const itemTypePlural = {
    emergencyContact: 'Emergency Contacts',
    representative: 'Authorised Representatives',
    document: 'Documents'
};

export function LimitRestriction({
    isOverLimit,
    violations = [],
    currentPlan,
    itemType,
    onUpgrade,
    showUpgradeButton = true
}: LimitRestrictionProps) {
    // Find relevant violation for this item type
    const relevantViolation = violations.find(v => {
        switch (itemType) {
            case 'emergencyContact':
                return v.type === 'emergencyContacts';
            case 'representative':
                return v.type === 'representatives';
            case 'document':
                return v.type === 'documents';
            default:
                return false;
        }
    });

    if (!isOverLimit && !relevantViolation) {
        return null;
    }

    const planName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

    return (
        <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="font-medium mb-1 flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Cannot Add New {itemTypeLabels[itemType]}
                        </div>
                        
                        {relevantViolation ? (
                            <div className="text-sm mb-2">
                                You're over the limit for {itemTypePlural[itemType]} on your {planName} plan: 
                                <Badge variant="destructive" className="ml-2">
                                    {relevantViolation.current}/{relevantViolation.limit}
                                </Badge>
                            </div>
                        ) : (
                            <div className="text-sm mb-2">
                                You've exceeded the limits for your {planName} plan.
                            </div>
                        )}
                        
                        <div className="text-sm">
                            <strong>Options to continue:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Upgrade to a higher plan with more capacity</li>
                                <li>Remove existing {itemTypePlural[itemType].toLowerCase()} to make room for new ones</li>
                            </ul>
                        </div>
                    </div>
                    
                    {showUpgradeButton && onUpgrade && (
                        <Button 
                            onClick={onUpgrade}
                            size="sm"
                            className="ml-4 flex items-center gap-1"
                        >
                            <ArrowUp className="h-4 w-4" />
                            Upgrade Plan
                        </Button>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
}

// Hook to check if user can add specific item type
export function useLimitCheck(
    canAddFunction: () => boolean,
    itemType: 'emergencyContact' | 'representative' | 'document',
    subscriptionData: {
        isOverLimit: boolean;
        violations: Array<{ type: string; current: number; limit: number; violation: string }>;
        currentPlan: SubscriptionLevel;
    }
) {
    const canAdd = canAddFunction();
    
    const LimitCheckComponent = ({ 
        onUpgrade,
        showUpgradeButton = true 
    }: { 
        onUpgrade?: () => void;
        showUpgradeButton?: boolean;
    }) => {
        if (canAdd) return null;
        
        return (
            <LimitRestriction
                isOverLimit={subscriptionData.isOverLimit}
                violations={subscriptionData.violations}
                currentPlan={subscriptionData.currentPlan}
                itemType={itemType}
                onUpgrade={onUpgrade}
                showUpgradeButton={showUpgradeButton}
            />
        );
    };
    
    return {
        canAdd,
        LimitCheckComponent
    };
}
