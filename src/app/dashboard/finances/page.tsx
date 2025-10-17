"use client";

import { useEffect, useState } from "react";
import { useAdminFinancesV2 } from "@/hooks/admin/use-admin-finances-v2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { formatCurrency } from "@/app/utils/formatting/currency";
import { formatDate } from "@/utils/formatDate";

export default function FinancesDashboard() {
  const {
    summaryStats,
    revenueByMonth,
    planDistribution,
    paymentStatus,
    subscriptionPlans,
    recentTransactions,
    loading,
    errors,
    lastRefreshed,
    fetchAllFinances,
    fetchSummary,
    getChartData,
    getRevenueByPlanData,
  } = useAdminFinancesV2();

  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAllFinances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    fetchAllFinances();
  };

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(timestamp);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600" variant="default">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            className="bg-yellow-500 hover:bg-yellow-600"
            variant="default"
          >
            Pending
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };



  return (
    <div className="container mx-auto py-10">
      {lastRefreshed && (
        <p className="text-sm text-gray-500 mt-2">
          Last updated: {formatTimestamp(lastRefreshed)}
        </p>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Summary Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.summary ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summaryStats.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {summaryStats.successfulTransactions}{" "}
                      successful transactions
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.summary ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summaryStats.currentMonthRevenue)}
                    </div>
                    <p
                      className={`text-xs flex items-center ${summaryStats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      <span className="mr-1">
                        {summaryStats.revenueGrowth >= 0 ? "↑" : "↓"}
                      </span>
                      {Math.abs(summaryStats.revenueGrowth).toFixed(1)}%
                      from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.summary ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summaryStats.avgTransactionValue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summaryStats.transactionCount} total transactions
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.summary ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-green-600">
                        {summaryStats.successfulTransactions}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Successful
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-yellow-600">
                        {summaryStats.pendingTransactions}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Pending
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-red-600">
                        {summaryStats.failedTransactions}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Failed
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>
                  Total revenue collected per month
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading.revenueByMonth ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveLine
                    data={[
                      {
                        id: "revenue",
                        data: revenueByMonth.labels.map(
                          (label: string, i: number) => ({
                            x: label,
                            y: revenueByMonth.data[i],
                          })
                        ),
                      },
                    ]}
                    margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                    xScale={{ type: "point" }}
                    yScale={{
                      type: "linear",
                      min: "auto",
                      max: "auto",
                    }}
                    yFormat=" >-$.2f"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legendPosition: "middle",
                      legendOffset: 32,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      format: (value) => `$${value}`,
                      legend: "Revenue",
                      legendPosition: "middle",
                      legendOffset: -40,
                    }}
                    colors={{ scheme: "category10" }}
                    pointSize={10}
                    pointColor={{ theme: "background" }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "serieColor" }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>
                  Transaction count by subscription level
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading.planDistribution ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsivePie
                    data={planDistribution.labels.map(
                      (label: string, i: number) => ({
                        id: label,
                        label,
                        value: planDistribution.data[i],
                      })
                    )}
                    margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: "nivo" }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{
                      from: "color",
                      modifiers: [["darker", 2]],
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>
                  Total revenue by subscription level
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading.planDistribution ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveBar
                    data={planDistribution.labels.map(
                      (label: string, i: number) => ({
                        plan: label,
                        revenue: planDistribution.revenue[i],
                      })
                    )}
                    keys={["revenue"]}
                    indexBy="plan"
                    margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
                    padding={0.3}
                    valueFormat=" >-$.2f"
                    colors={{ scheme: "nivo" }}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      format: (value) => `$${value}`,
                    }}
                    labelFormat=" >-$.2f"
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    animate={true}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Most recent payment transactions processed through the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of your recent transactions.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading.recentTransactions ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={`cell-${i}-${j}`}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        <TableCell>{tx.id}</TableCell>
                        <TableCell className="capitalize">
                          {tx.subscriptionLevel}
                        </TableCell>
                        <TableCell>{formatCurrency(tx.amount)}</TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(tx.paymentStatus)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {tx.transactionId.substring(0, 12)}...
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                Currently configured PayPal subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  Active subscription plans configuration
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Commitment</TableHead>
                    <TableHead>PayPal Plan ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading.subscriptionPlans ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={`cell-${i}-${j}`}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : subscriptionPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No subscription plans configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptionPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          {plan.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {plan.planLevel}
                        </TableCell>
                        <TableCell>{formatCurrency(plan.price)}</TableCell>

                        <TableCell>
                          {plan.commitmentYears >= 1
                            ? `${plan.commitmentYears} years`
                            : "None"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {plan.planLevel}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts & Analytics Tab */}
        <TabsContent value="charts">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {loading.revenueByMonth ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveLine
                    data={[
                      {
                        id: "revenue",
                        data: revenueByMonth.labels.map(
                          (label: string, i: number) => ({
                            x: label,
                            y: revenueByMonth.data[i],
                          })
                        ),
                      },
                    ]}
                    margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                    xScale={{ type: "point" }}
                    yScale={{
                      type: "linear",
                      min: "auto",
                      max: "auto",
                    }}
                    yFormat=" >-$.2f"
                    curve="natural"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legendPosition: "middle",
                      legendOffset: 32,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      format: (value) => `$${value}`,
                      legend: "Revenue",
                      legendPosition: "middle",
                      legendOffset: -40,
                    }}
                    colors={{ scheme: "category10" }}
                    lineWidth={3}
                    pointSize={10}
                    pointColor={{ theme: "background" }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "serieColor" }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    legends={[
                      {
                        anchor: "bottom-right",
                        direction: "column",
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: "left-to-right",
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: "circle",
                        symbolBorderColor: "rgba(0, 0, 0, .5)",
                        effects: [
                          {
                            on: "hover",
                            style: {
                              itemBackground: "rgba(0, 0, 0, .03)",
                              itemOpacity: 1,
                            },
                          },
                        ],
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>
                  Transaction count by subscription level
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {loading.planDistribution ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsivePie
                    data={planDistribution.labels.map(
                      (label: string, i: number) => ({
                        id: label,
                        label,
                        value: planDistribution.data[i],
                        percentage: `${planDistribution.percentages[i]}%`,
                      })
                    )}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: "nivo" }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{
                      from: "color",
                      modifiers: [["darker", 2]],
                    }}
                    legends={[
                      {
                        anchor: "bottom",
                        direction: "row",
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: "#999",
                        itemDirection: "left-to-right",
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: "circle",
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>
                  Distribution of payment transaction statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {loading.paymentStatus ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsivePie
                    data={paymentStatus.labels.map((label: string, i: number) => ({
                      id: label,
                      label,
                      value: paymentStatus.data[i],
                    }))}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    colors={{ scheme: "category10" }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{
                      from: "color",
                      modifiers: [["darker", 2]],
                    }}
                    legends={[
                      {
                        anchor: "bottom",
                        direction: "row",
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: "#999",
                        itemDirection: "left-to-right",
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: "circle",
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
