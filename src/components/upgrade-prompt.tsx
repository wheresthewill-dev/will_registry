// Upgrade Prompt Component
// Reusable component for showing subscription upgrade prompts

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, ArrowUp, Check } from "lucide-react";
import { UpgradePrompt } from '@/app/utils/repo_services/config/subscription-limits';
import { SUBSCRIPTION_TIERS } from '@/app/utils/repo_services/interfaces/user_subscription';

interface UpgradePromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: UpgradePrompt;
  onUpgrade?: () => void;
}

export function UpgradePromptDialog({ 
  isOpen, 
  onClose, 
  prompt, 
  onUpgrade 
}: UpgradePromptDialogProps) {
  const router = useRouter();
  const suggestedConfig = SUBSCRIPTION_TIERS[prompt.suggestedTier];
  const currentConfig = SUBSCRIPTION_TIERS[prompt.currentTier];

  const handleUpgrade = () => {
    onUpgrade?.();
    // Navigate to subscription page
        onClose(); 
    router.push('/dashboard/subscription');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <DialogTitle>{prompt.title}</DialogTitle>
          </div>
          <DialogDescription>
            {prompt.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current vs Suggested Tier Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Tier */}
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">
                    Current
                  </Badge>
                  <h3 className="font-semibold text-gray-600">
                    {currentConfig.name}
                  </h3>
                  <p className="text-2xl font-bold text-gray-500">
                    ${currentConfig.price}
                  </p>
                  <p className="text-xs text-gray-400">
                    {currentConfig.duration || 'Free forever'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Tier */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <Badge className="mb-2 bg-blue-500">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                  <h3 className="font-semibold text-blue-900">
                    {suggestedConfig.name}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${suggestedConfig.price}
                  </p>
                  <p className="text-xs text-blue-500">
                    {suggestedConfig.duration}
                  </p>
                  {suggestedConfig.save > 0 && (
                    <Badge variant="outline" className="mt-1 text-green-600 border-green-300">
                      Save ${suggestedConfig.save}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits List */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              What you'll get with {suggestedConfig.name}:
            </h4>
            <ul className="space-y-1">
              {prompt.benefits.slice(0, 4).map((benefit: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to {suggestedConfig.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Compact limit indicator component
interface LimitIndicatorProps {
  current: number;
  limit: number | -1;
  type: 'representatives' | 'emergencyContacts';
  className?: string;
}

export function LimitIndicator({ current, limit, type, className = "" }: LimitIndicatorProps) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isAtLimit = limit !== -1 && current >= limit;
  const isNearLimit = limit !== -1 && percentage >= 80;

  const getStatusColor = () => {
    if (limit === -1) return 'text-green-600';
    if (isAtLimit) return 'text-red-600';
    if (isNearLimit) return 'text-amber-600';
    return 'text-green-600';
  };

  const getDisplayText = () => {
    if (limit === -1) return `${current} (unlimited)`;
    return `${current} / ${limit}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getDisplayText()}
      </span>
      {limit !== -1 && (
        <div className="flex-1 max-w-20">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit ? 'bg-red-500' : 
                isNearLimit ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
