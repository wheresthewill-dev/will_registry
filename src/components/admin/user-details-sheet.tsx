"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  CreditCard,
  Clock,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCog,
  X,
  ContactIcon,
} from "lucide-react";

interface UserDetails {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  username?: string;
  phone?: string;
  subscription?: {
    id: string;
    subscription_level: string;
    status: string;
    start_date: string;
    end_date: string;
    payment_amount: number;
    payment_method: string;
    payment_status: string;
  };
  profile?: {
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    dob?: string;
  };
  contacts?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    relationship: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    created_at: string;
    size: number;
    location: string;
  }>;
  representatives?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    relationship: string;
    organization?: string;
    authorization_date: string;
    authorization_expires?: string;
    authorization_status: string;
    notes?: string;
  }>;
}

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  getUserDetails: (userId: string) => Promise<UserDetails | null>;
}

export function UserDetailsSheet({ open, onOpenChange, userId, getUserDetails }: UserDetailsSheetProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserDetails = async () => {
      if (userId && open) {
        setLoading(true);
        setUserDetails(null); // Clear previous data
        
        try {
          const details = await getUserDetails(userId);
          
          if (details) {
            setUserDetails(details);
          } else {
            toast.error("Could not load user details");
          }
        } catch (error) {
          console.error("Error loading user details:", error);
          toast.error("Error loading user details");
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserDetails();
  }, [userId, open, getUserDetails]);

  // Format date helper with error handling
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return "Invalid Date";
    }
  };
  
  // Safe render helper
  const safeRender = (callback: () => React.ReactNode): React.ReactNode => {
    try {
      return callback();
    } catch (error) {
      console.error("Render error:", error);
      return null;
    }
  };

  // Get subscription level badge
  const getSubscriptionBadge = (level?: string) => {
    if (!level) return <Badge variant="outline">No Subscription</Badge>;
    
    switch (level.toLowerCase()) {
      case "gold":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Gold</Badge>;
      case "silver":
        return <Badge className="bg-gray-400 hover:bg-gray-500">Silver</Badge>;
      case "bronze":
        return <Badge className="bg-amber-600 hover:bg-amber-700">Bronze</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // Get subscription status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case "active":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Cancelled</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex justify-between items-center">
            <SheetTitle>User Details</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
          <SheetDescription>
            {loading ? (
              <Skeleton className="h-4 w-2/3" />
            ) : (
              userDetails && (
                <span>
                  Viewing details for {userDetails.firstname} {userDetails.lastname}
                </span>
              )
            )}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : userDetails ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="representatives">Representatives</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" /> Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p>{userDetails.firstname} {userDetails.lastname}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{userDetails.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Username</p>
                      <p>{userDetails.username || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p>{userDetails.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Role</p>
                      <Badge className="mt-1" variant={userDetails.role === "admin" ? "default" : userDetails.role === "super_admin" ? "destructive" : "outline"}>
                        {userDetails.role || "user"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registered</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(userDetails.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {userDetails.profile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" /> Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {userDetails.profile.address_line1 && (
                      <p>{userDetails.profile.address_line1}</p>
                    )}
                    {userDetails.profile.address_line2 && (
                      <p>{userDetails.profile.address_line2}</p>
                    )}
                    {(userDetails.profile.city || userDetails.profile.state_province || userDetails.profile.postal_code) && (
                      <p>
                        {userDetails.profile.city && `${userDetails.profile.city}, `}
                        {userDetails.profile.state_province && `${userDetails.profile.state_province} `}
                        {userDetails.profile.postal_code && userDetails.profile.postal_code}
                      </p>
                    )}
                    {userDetails.profile.country && (
                      <p>{userDetails.profile.country}</p>
                    )}
                    {userDetails.profile.dob && (
                      <div className="flex items-center gap-2 pt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Born: {formatDate(userDetails.profile.dob)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" /> Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userDetails.subscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Level</span>
                        <div>
                          {safeRender(() => getSubscriptionBadge(userDetails.subscription?.subscription_level))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status</span>
                        <div>{safeRender(() => getStatusBadge(userDetails.subscription?.status))}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Start Date</span>
                        <span>{safeRender(() => formatDate(userDetails.subscription?.start_date))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">End Date</span>
                        <span>{safeRender(() => formatDate(userDetails.subscription?.end_date))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Payment Method</span>
                        <span>{safeRender(() => userDetails.subscription?.payment_method || "N/A")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Amount</span>
                        <span>{safeRender(() => `$${userDetails.subscription?.payment_amount?.toFixed(2) || "0.00"}`)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Payment Status</span>
                        <span>{safeRender(() => userDetails.subscription?.payment_status || "N/A")}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No active subscription found</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-end">
                  <Button variant="outline">Manage Subscription</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ContactIcon className="mr-2 h-5 w-5" /> Emergency Contacts
                  </CardTitle>
                  <CardDescription>
                    User's emergency contacts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userDetails.contacts && userDetails.contacts.length > 0 ? (
                    <div className="space-y-4">
                      {userDetails.contacts.map((contact) => (
                        <div key={contact.id} className="border rounded-lg p-4">
                          <div className="flex justify-between">
                            <div className="font-medium">{contact.name}</div>
                            <Badge variant="outline">{contact.relationship}</Badge>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="mr-2 h-4 w-4" />
                              {contact.email}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-2 h-4 w-4" />
                              {contact.phone}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No emergency contacts found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Representatives Tab */}
            <TabsContent value="representatives">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCog className="mr-2 h-5 w-5" /> Authorized Representatives
                  </CardTitle>
                  <CardDescription>
                    People authorized to act on behalf of the user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userDetails.representatives && userDetails.representatives.length > 0 ? (
                    <div className="space-y-4">
                      {userDetails.representatives.map((rep) => (
                        <div key={rep.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{rep.name}</div>
                              {rep.organization && (
                                <div className="text-sm text-muted-foreground">
                                  {rep.organization}
                                </div>
                              )}
                            </div>
                            <Badge 
                              variant={
                                rep.authorization_status === "active" ? "default" : 
                                rep.authorization_status === "expired" ? "destructive" : 
                                rep.authorization_status === "pending" ? "secondary" : 
                                "outline"
                              }
                            >
                              {rep.authorization_status}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="mr-2 h-4 w-4" />
                              {rep.email}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-2 h-4 w-4" />
                              {rep.phone}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Badge variant="outline" className="mr-2">{rep.relationship}</Badge>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t text-sm">
                            <div className="flex justify-between text-muted-foreground">
                              <div>Authorized: {formatDate(rep.authorization_date)}</div>
                              {rep.authorization_expires && (
                                <div>Expires: {formatDate(rep.authorization_expires)}</div>
                              )}
                            </div>
                            {rep.notes && (
                              <div className="mt-2 italic">{rep.notes}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No authorized representatives found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" /> Documents
                  </CardTitle>
                  <CardDescription>
                    User's uploaded documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userDetails.documents && userDetails.documents.length > 0 ? (
                    <div className="space-y-2">
                      {userDetails.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between border p-3 rounded-md">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{doc.type}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No documents found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">User details not available</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
