"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppConfig } from "@/app/utils/repo_services/hooks/app_config";
import { AppConfig } from "@/app/utils/repo_services/interfaces/app_config";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function PageSettings() {
  const { data, loading, error, updateConfig, refresh } = useAppConfig();
  const [formData, setFormData] = useState<Partial<AppConfig>>({
    business_address: "",
    business_contact: "",
    customer_support_email: "",
    paypal_enabled: false,
    paypal_key: "",
    paypal_secret: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load data when component mounts
  useEffect(() => {
    if (data) {
      setFormData({
        business_address: data.business_address || "",
        business_contact: data.business_contact || "",
        customer_support_email: data.customer_support_email || "",
        paypal_enabled: data.paypal_enabled ?? false,
        paypal_key: data.paypal_key || "",
        paypal_secret: data.paypal_secret || "",
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkbox inputs separately
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const success = await updateConfig(formData);
      
      if (success) {
        toast.success("Settings updated", {
          description: "Business information has been updated successfully."
        });
        
        // Refresh data to ensure we're showing the latest
        refresh();
      } else {
        toast.error("Update failed", {
          description: error || "Something went wrong while updating settings."
        });
      }
    } catch (err) {
      toast.error("Error", {
        description: "An unexpected error occurred."
      });
      console.error("Error updating app config:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading business settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex flex-col gap-y-6">
        <div>
          <h1 className="text-3xl font-bold">Page Settings</h1>
          <p className="text-muted-foreground">
            Manage business information displayed on your website.
          </p>
        </div>

        <Tabs defaultValue="business-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="business-info">Business Information</TabsTrigger>
            <TabsTrigger value="payment">Payment Settings</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="business-info">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update the contact information displayed on your website.
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_address">Business Address</Label>
                    <Input
                      id="business_address"
                      name="business_address"
                      value={formData.business_address || ""}
                      onChange={handleChange}
                      placeholder="123 Main Street, City, Country"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business_contact">Business Contact</Label>
                    <Input
                      id="business_contact"
                      name="business_contact"
                      value={formData.business_contact || ""}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer_support_email">Support Email</Label>
                    <Input
                      id="customer_support_email"
                      name="customer_support_email"
                      value={formData.customer_support_email || ""}
                      onChange={handleChange}
                      placeholder="support@example.com"
                      type="email"
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={loading || isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment providers for your application.
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">PayPal Configuration</h3>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="paypal_enabled"
                        name="paypal_enabled"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={formData.paypal_enabled || false}
                        onChange={handleChange}
                      />
                      <Label htmlFor="paypal_enabled">Enable PayPal Payments</Label>
                    </div>
                    
                    {formData.paypal_enabled && (
                      <div className="space-y-4 border rounded-md p-4 bg-gray-50">
                        <div className="space-y-2">
                          <Label htmlFor="paypal_key">PayPal Client ID</Label>
                          <Input
                            id="paypal_key"
                            name="paypal_key"
                            value={formData.paypal_key || ""}
                            onChange={handleChange}
                            placeholder="PayPal Client ID"
                            className="font-mono text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="paypal_secret">PayPal Secret</Label>
                          <Input
                            id="paypal_secret"
                            name="paypal_secret"
                            value={formData.paypal_secret || ""}
                            onChange={handleChange}
                            placeholder="PayPal Secret"
                            className="font-mono text-sm"
                            type="password"
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: PayPal credentials are stored securely and used for processing payments.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={loading || isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize how your website looks. (Coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  This feature is coming soon. Stay tuned for updates!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
