"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountSettingsContext } from "@/contexts/AccountSettingsContext";
import Link from "next/link";
import { ROUTES } from "@/app/constants/routes";
import { VARIANT_STYLES } from "@/app/constants/ui-variants";
import { Switch } from "@/components/ui/switch";

export default function SubscriptionBillingSection() {
  const {
    paymentHistory,
    isLoading,
    subscriptionEndDate,
    currentDate,
    userSubscription,
  } = useAccountSettingsContext();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your current subscription details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/40 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  {userSubscription.name} Plan
                  <Badge className="ml-2">Current</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {!userSubscription.is_recurring
                    ? "This is a free plan."
                    : userSubscription.is_recurring &&
                      `Billed ${userSubscription.duration} at $${userSubscription.price || "0.00"}`}
                </p>
                <p className="text-sm mt-4">
                  {!userSubscription.is_recurring
                    ? subscriptionEndDate
                      ? `Subscription valid until: ${subscriptionEndDate}`
                      : "No expiration date."
                    : `Next billing date: ${subscriptionEndDate}`}
                </p>
              </div>
              <div className="flex flex-col space-y-2 mt-4 md:mt-0">
                <Link href={ROUTES.subscription}>
                  <Button>Upgrade Plan</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing settings */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Billing Settings</CardTitle>
          <CardDescription>
            Manage your payment methods and billing settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto-Renewal</h4>
              <p className="text-sm text-muted-foreground">
                Your subscription will automatically renew on{" "}
                {subscriptionEndDate}.
              </p>
            </div>
            <Switch defaultChecked={userSubscription.is_recurring} />
          </div>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your recent payment transactions. Last updated: {currentDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="w-[80px] h-[20px]" />
                  <Skeleton className="w-[60px] h-[20px]" />
                  <Skeleton className="w-[100px] h-[20px]" />
                  <Skeleton className="w-[60px] h-[20px]" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* TODO: Get payment_transactions */}
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.amount}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={VARIANT_STYLES.SUCCESS}
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No payment history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">
            View All Transactions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
