"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  User,
  CreditCard,
  Clock,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCog,
  AlertCircle,
  Check,
  CheckCircle,
  Contact,
  Users,
  ExternalLink,
  Home,
  Activity,
  Settings,
  AtSign,
  Eye
} from "lucide-react";
import { getDocumentDisplayName, hasDocumentFile, getFormattedLastUpdated } from "@/app/utils/repo_services/interfaces/document_location";
import { SUBSCRIPTION_TIERS, SubscriptionLevel } from "@/app/utils/repo_services/interfaces/user_subscription";
import { UserContact, getContactByType } from "@/app/utils/repo_services/interfaces/user_contact";
import { UserAddress } from "@/app/utils/repo_services/interfaces/user_address";
import { RecentActivity, getActivityIcon, getActivityColor, getRelativeTime, getTableDisplayName } from "@/app/utils/repo_services/interfaces/recent_activity";
import { UserConfig } from "@/app/utils/repo_services/interfaces/user_config";
import ViewWillModal from "@/app/dashboard/wills/modals/ViewWillModal";

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  
  // State for modal control
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  
  // State for user details
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user details directly 
  useEffect(() => {
    const fetchUserDirectly = async () => {
      if (!userId) {
        setError("User ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Directly fetching details for user ID:", userId);
        
        // Make direct API call
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch user details');
        }
        
        const data = await response.json();
        console.log("API response:", data);
        
        if (data && data.user) {
          setUserDetails({
            ...data.user,
            subscription: data.subscription,
            profile: data.profile,
            contacts: data.contacts || [],
            documents: data.documents || [],
            representatives: data.representatives || [],
            userContacts: data.userContacts || [],
            addresses: data.addresses || [],
            recentActivities: data.recentActivities || [],
            userConfig: data.userConfig
          });
          console.log("Updated userDetails with API data:", {
            userContacts: data.userContacts,
            addresses: data.addresses,
            recentActivities: data.recentActivities,
            userConfig: data.userConfig
          });
          setError(null);
        } else {
          throw new Error("Invalid API response structure");
        }
      } catch (err: any) {
        console.error("Error fetching user details:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDirectly();
  }, [userId]);

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
    
    switch (level?.toLowerCase()) {
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

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      default: return 'outline';
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (!userDetails) return "U";
    const firstName = userDetails.firstname || "";
    const lastName = userDetails.lastname || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!userDetails) return "User";
    return `${userDetails.firstname || ""} ${userDetails.lastname || ""}`.trim() || "User";
  };

  console.log("Component state:", { loading, userDetails, error });
  
  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !userDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Details</h1>
            <p className="text-gray-600">Error loading user details</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading User Details</h2>
            <p className="text-gray-600 mb-4">{error || "User details not found"}</p>
            <Button onClick={() => router.push('/dashboard/users')}>
              Return to User Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{getUserDisplayName()}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{userDetails.email}</span>
              <Badge variant={getRoleBadgeVariant(userDetails.role)} className="ml-2">
                {userDetails.role}
              </Badge>
              {userDetails.subscription && userDetails.subscription.subscription_level && (
                <div className="ml-2 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {getSubscriptionBadge(userDetails.subscription.subscription_level)}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a href={`mailto:${userDetails.email}`} target="_blank" rel="noopener noreferrer">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </a>
          </Button>
         
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="emergency-contacts">Contacts</TabsTrigger>
          <TabsTrigger value="representatives">Representatives</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">First Name</p>
                    <p>{userDetails.firstname || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                    <p>{userDetails.lastname || "N/A"}</p>
                  </div>
                  {userDetails.middlename && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Middle Name</p>
                      <p>{userDetails.middlename}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Username</p>
                    <p>{userDetails.username || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{userDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{userDetails.id}</p>
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

            {/* Contact Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AtSign className="mr-2 h-5 w-5" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userDetails.userContacts && userDetails.userContacts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {userDetails.userContacts.map((contact: UserContact) => (
                      <div key={contact.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          {contact.type === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                          {contact.type === 'phone' && <Phone className="h-4 w-4 text-green-500" />}
                          {!['email', 'phone'].includes(contact.type || '') && <AtSign className="h-4 w-4 text-gray-500" />}
                          <span className="text-sm font-medium capitalize">{contact.type || "Contact"}</span>
                        </div>
                        <span>{contact.value || "N/A"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
                    <AtSign className="h-8 w-8 mb-2 opacity-50" />
                    <p>No contact information available</p>
                  </div>
                )}
                
                {/* Phone contact from profile if available */}
                {userDetails.profile && userDetails.profile.phone && !userDetails.userContacts?.some((c: UserContact) => c.type === 'phone') && (
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <span>{userDetails.profile.phone}</span>
                  </div>
                )}
                
                {/* Email from user if not in contacts */}
                {userDetails.email && !userDetails.userContacts?.some((c: UserContact) => c.type === 'email') && (
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <span>{userDetails.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Administrative Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCog className="mr-2 h-5 w-5" /> Administrative Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Role</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(userDetails.role)}>
                        {userDetails.role}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role Description</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {userDetails.role === "user" && "Standard user with basic permissions"}
                      {userDetails.role === "admin" && "Administrator with elevated permissions"}
                      {userDetails.role === "super_admin" && "Super administrator with full system access"}
                      {!["user", "admin", "super_admin"].includes(userDetails.role) && "Custom role"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                    <p>{userDetails.last_login ? formatDate(userDetails.last_login) : "Never"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Addresses Card - can have multiple addresses */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Home className="mr-2 h-5 w-5" /> Addresses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.addresses && userDetails.addresses.length > 0 ? (
                  <div className="space-y-4">
                    {userDetails.addresses.map((address: UserAddress) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">{address.type || "Address"}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Address Line</p>
                            <p>{address.address_line || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Town/City</p>
                            <p>{address.town || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">State/Province</p>
                            <p>{address.state || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Postal Code</p>
                            <p>{address.post_code || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Country</p>
                            <p>{address.country || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userDetails.profile && (userDetails.profile.address_line1 || userDetails.profile.city) ? (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Primary</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Address Line 1</p>
                        <p>{userDetails.profile.address_line1 || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Address Line 2</p>
                        <p>{userDetails.profile.address_line2 || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">City</p>
                        <p>{userDetails.profile.city || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">State/Province</p>
                        <p>{userDetails.profile.state_province || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Postal Code</p>
                        <p>{userDetails.profile.postal_code || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Country</p>
                        <p>{userDetails.profile.country || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Home className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-lg font-medium text-gray-700 mb-1">No Address Information</p>
                    <p>This user hasn't provided any address details.</p>
                  </div>
                )}
                
                {/* Birth Info */}
                {userDetails.profile && userDetails.profile.dob && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-md font-medium">Birth Information</h3>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth:</p>
                      <p>{formatDate(userDetails.profile.dob)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" /> Recent Activities
                </CardTitle>
                <CardDescription>
                  Latest user actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDetails.recentActivities && userDetails.recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {userDetails.recentActivities.map((activity: RecentActivity) => (
                      <div key={activity.id} className="flex items-start gap-3 border-b pb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <span className="text-lg" role="img" aria-label={activity.activity_type}>
                            {getActivityIcon(activity.activity_type, activity.table_name)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${getActivityColor(activity.activity_type)}`}>
                              {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)} {getTableDisplayName(activity.table_name)}
                            </p>
                            <span className="text-xs text-muted-foreground">{getRelativeTime(activity.created_at)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Activity className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-lg font-medium text-gray-700 mb-1">No Recent Activity</p>
                    <p>We haven't tracked any recent activities for this user.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> Subscription Details
              </CardTitle>
              <CardDescription>
                Current subscription information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userDetails.subscription ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-blue-50">
                    <div>
                      <p className="text-sm text-gray-600">Current Plan</p>
                      <div className="flex items-center gap-2 mt-1">
                        <h3 className="text-xl font-bold">
                          {userDetails.subscription.subscription_level?.charAt(0).toUpperCase() + userDetails.subscription.subscription_level?.slice(1)} Plan
                        </h3>
                        <Badge variant={userDetails.subscription.is_active ? "default" : "destructive"}>
                          {userDetails.subscription.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      {safeRender(() => getSubscriptionBadge(userDetails.subscription.subscription_level))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Subscription Details</h4>
                      <div className="space-y-3 border rounded-lg p-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subscription ID:</span>
                          <span className="font-medium font-mono text-sm">
                            {safeRender(() => userDetails.subscription.id || "N/A")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subscription Level:</span>
                          <span className="font-medium">
                            {safeRender(() => userDetails.subscription.subscription_level?.charAt(0).toUpperCase() + userDetails.subscription.subscription_level?.slice(1) || "N/A")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Status:</span>
                          <span className="font-medium">
                            {safeRender(() => userDetails.subscription.is_active ? "Yes" : "No")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span className="font-medium">
                            {safeRender(() => formatDate(userDetails.subscription.subscription_start_date))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Date:</span>
                          <span className="font-medium">
                            {safeRender(() => userDetails.subscription.subscription_end_date ? 
                              formatDate(userDetails.subscription.subscription_end_date) : 
                              userDetails.subscription.subscription_level === "bronze" ? "Perpetual" : "N/A")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created At:</span>
                          <span className="font-medium">
                            {safeRender(() => formatDate(userDetails.subscription.created_at))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Updated At:</span>
                          <span className="font-medium">
                            {safeRender(() => formatDate(userDetails.subscription.updated_at))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Plan Features & Limits</h4>
                      <div className="border rounded-lg">
                        {userDetails.subscription.subscription_level && (
                          <div className="p-4">
                            <h5 className="font-medium mb-2">
                              {safeRender(() => {
                                const level = userDetails.subscription.subscription_level as SubscriptionLevel;
                                return SUBSCRIPTION_TIERS[level]?.name || level.charAt(0).toUpperCase() + level.slice(1);
                              })}
                              {" "} 
                              Plan Details
                            </h5>
                            <p className="text-sm text-gray-600 mb-3">
                              {safeRender(() => {
                                const level = userDetails.subscription.subscription_level as SubscriptionLevel;
                                return SUBSCRIPTION_TIERS[level]?.description || "No description available";
                              })}
                            </p>
                            
                            <div className="space-y-4 mt-4">
                              <div>
                                <h6 className="text-sm font-medium mb-2">Features:</h6>
                                <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                                  {safeRender(() => {
                                    const level = userDetails.subscription.subscription_level as SubscriptionLevel;
                                    return SUBSCRIPTION_TIERS[level]?.features.map((feature, i) => (
                                      <li key={i} className="text-gray-700">
                                        <Check className="inline h-3.5 w-3.5 text-green-500 mr-1" />
                                        {feature}
                                      </li>
                                    ));
                                  })}
                                </ul>
                              </div>
                              
                              <div>
                                <h6 className="text-sm font-medium mb-2">Limits:</h6>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <div className="text-sm">
                                    <span className="text-gray-600">Emergency Contacts:</span>{" "}
                                    <span className="font-medium">
                                      {safeRender(() => {
                                        const level = userDetails.subscription.subscription_level as SubscriptionLevel;
                                        return SUBSCRIPTION_TIERS[level]?.limits.emergencyContacts;
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">Representatives:</span>{" "}
                                    <span className="font-medium">
                                      {safeRender(() => {
                                        const level = userDetails.subscription.subscription_level as SubscriptionLevel;
                                        return SUBSCRIPTION_TIERS[level]?.limits.representatives;
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">Storage:</span>{" "}
                                    <span className="font-medium">
                                      {safeRender(() => {
                                        const level = userDetails.subscription.subscription_level as SubscriptionLevel;
                                        const limit = SUBSCRIPTION_TIERS[level]?.limits.storageGB;
                                        return `${limit} GB`;
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">Documents:</span>{" "}
                                    <span className="font-medium">
                                      {safeRender(() => {
                                        const level = userDetails.subscription.subscription_level as SubscriptionLevel;
                                        const limit = SUBSCRIPTION_TIERS[level]?.limits.documentsCount;
                                        return limit === -1 ? "Unlimited" : limit;
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <CreditCard className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription Found</h3>
                  <p className="text-gray-600 mb-4">
                    This user doesn't have a subscription record in the system.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contacts Tab */}
        <TabsContent value="emergency-contacts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5 text-green-600" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                People designated as emergency contacts by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userDetails.contacts && userDetails.contacts.length > 0 ? (
                <div>
                  {/* Summary stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {userDetails.contacts.filter((c: any) => 
                            c.status === "active" || c.status === "registered").length}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Active Contacts
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600">
                          {userDetails.contacts.filter((c: any) => c.status === "pending").length}
                        </div>
                        <p className="text-sm text-muted-foreground">Pending Invitations</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600">
                          {userDetails.contacts.filter((c: any) => 
                            c.status === "expired" || 
                            (c.status === "pending" && c.invite_expires && new Date(c.invite_expires) < new Date())
                          ).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Expired Invitations</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{userDetails.contacts.length}</div>
                        <p className="text-sm text-muted-foreground">
                          Total Contacts
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {userDetails.contacts.map((contact: any) => (
                      <Card key={contact.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarFallback>
                                  {contact.firstname?.[0]?.toUpperCase() || "C"}
                                  {contact.lastname?.[0]?.toUpperCase() || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">
                                  {`${contact.firstname || ''} ${contact.lastname || ''}`.trim() || contact.name || 'Unknown'}
                                </CardTitle>
                                <CardDescription className="text-sm">{contact.email}</CardDescription>
                              </div>
                            </div>
                            <Badge
                              variant={
                                contact.status === "active" || contact.status === "registered" ? "default" :
                                contact.status === "expired" ? "destructive" :
                                contact.status === "pending" ? "secondary" :
                                "outline"
                              }
                            >
                              {contact.status === "active" || contact.status === "registered" ? (
                                <div className="flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" /> {contact.status === "registered" ? "Registered" : "Active"}
                                </div>
                              ) : contact.status === "pending" ? (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" /> Pending
                                </div>
                              ) : contact.status === "expired" || (contact.invite_expires && new Date(contact.invite_expires) < new Date()) ? (
                                <div className="flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Expired
                                </div>
                              ) : (
                                contact.status || "Unknown"
                              )}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium">Relationship</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {contact.relationship || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">
                                {contact.email || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <p className="text-sm text-muted-foreground">
                                {contact.contact_number || contact.phone || "N/A"}
                              </p>
                            </div>
                            {contact.ec_user_id && (
                              <div>
                                <p className="text-sm font-medium">User ID</p>
                                <p className="text-sm text-muted-foreground font-mono text-xs">
                                  {contact.ec_user_id}
                                </p>
                              </div>
                            )}
                            {contact.user_role && (
                              <div>
                                <p className="text-sm font-medium">Role</p>
                                <p className="text-sm text-muted-foreground">
                                  {contact.user_role}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">Created</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(contact.created_at)}
                              </p>
                            </div>
                            {contact.invite_expires && (
                              <div>
                                <p className="text-sm font-medium">Invitation Expires</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(contact.invite_expires)}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {contact.registered_at && (
                            <div className="mt-4 p-2 bg-green-50 rounded-lg">
                              <p className="text-sm font-medium text-green-800">
                                Joined on: {formatDate(contact.registered_at)}
                              </p>
                            </div>
                          )}
                          
                          {contact.invite_token && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800 font-mono truncate">
                                Invite token: {contact.invite_token}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Contact className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Emergency Contacts</h3>
                  <p className="text-gray-600">
                    This user hasn't added any emergency contacts yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Representatives Tab */}
        <TabsContent value="representatives">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Authorized Representatives
              </CardTitle>
              <CardDescription>
                People authorized to act on behalf of this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userDetails.representatives && userDetails.representatives.length > 0 ? (
                <div>
                  {/* Summary stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {userDetails.representatives.filter((rep: any) => 
                            rep.status === "active" || rep.status === "registered").length}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Active Representatives
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600">
                          {userDetails.representatives.filter((rep: any) => rep.status === "pending").length}
                        </div>
                        <p className="text-sm text-muted-foreground">Pending Invitations</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600">
                          {userDetails.representatives.filter((rep: any) => 
                            rep.status === "expired" || 
                            (rep.status === "pending" && rep.invite_expires && new Date(rep.invite_expires) < new Date())
                          ).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Expired Invitations</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{userDetails.representatives.length}</div>
                        <p className="text-sm text-muted-foreground">
                          Total Representatives
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {userDetails.representatives.map((rep: any) => (
                      <Card key={rep.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarFallback>
                                  {rep.firstname?.[0]?.toUpperCase() || "A"}
                                  {rep.lastname?.[0]?.toUpperCase() || "R"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">
                                  {rep.name || `${rep.firstname || ''} ${rep.lastname || ''}`.trim() || 'Unknown'}
                                </CardTitle>
                                <CardDescription className="text-sm">{rep.email}</CardDescription>
                              </div>
                            </div>
                            <Badge
                              variant={
                                rep.status === "active" || rep.status === "registered" ? "default" :
                                rep.status === "expired" ? "destructive" :
                                rep.status === "pending" ? "secondary" :
                                "outline"
                              }
                            >
                              {rep.status === "active" || rep.status === "registered" ? (
                                <div className="flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" /> {rep.status === "registered" ? "Registered" : "Active"}
                                </div>
                              ) : rep.status === "pending" ? (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" /> Pending
                                </div>
                              ) : rep.status === "expired" ? (
                                <div className="flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Expired
                                </div>
                              ) : (
                                rep.status || "Unknown"
                              )}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium">Full Name</p>
                              <p className="text-sm text-muted-foreground">
                                {rep.name || `${rep.firstname || ''} ${rep.lastname || ''}`.trim() || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">{rep.email || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <p className="text-sm text-muted-foreground">{rep.phone || "N/A"}</p>
                            </div>
                            {rep.ar_user_id && (
                              <div>
                                <p className="text-sm font-medium">User ID</p>
                                <p className="text-sm text-muted-foreground font-mono text-xs">{rep.ar_user_id}</p>
                              </div>
                            )}
                            {rep.user_role && (
                              <div>
                                <p className="text-sm font-medium">Role</p>
                                <p className="text-sm text-muted-foreground">{rep.user_role}</p>
                              </div>
                            )}
                            {rep.organization && (
                              <div>
                                <p className="text-sm font-medium">Organization</p>
                                <p className="text-sm text-muted-foreground">{rep.organization}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">Created</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(rep.created_at)}
                              </p>
                            </div>
                            {rep.invite_expires && (
                              <div>
                                <p className="text-sm font-medium">Invitation Expires</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(rep.invite_expires)}
                                </p>
                              </div>
                            )}
                          </div>
                          {rep.registered_at && (
                            <div className="mt-4 p-2 bg-green-50 rounded-lg">
                              <p className="text-sm font-medium text-green-800">
                                Joined on: {formatDate(rep.registered_at)}
                              </p>
                            </div>
                          )}
                          {rep.invite_token && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800 font-mono truncate">
                                Invite token: {rep.invite_token}
                              </p>
                            </div>
                          )}
                          {rep.notes && (
                            <div className="mt-2 italic text-gray-500">
                              <p className="text-sm">{rep.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Representatives</h3>
                  <p className="text-gray-600">
                    This user hasn't added any authorized representatives yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> User Documents
              </CardTitle>
              <CardDescription>
                View the user's wills and important documents. Click on a document to see details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search controls - view only */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                  type="text"
                  placeholder="Search by title..."
                  className="md:w-1/2"
                  disabled
                />
                <Select disabled>
                  <SelectTrigger className="md:w-40">
                    <SelectValue placeholder="Filter by Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Empty content */}
                  </SelectContent>
                </Select>
              </div>

              {/* Documents table */}
              {userDetails.documents && userDetails.documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="w-full border rounded-lg shadow-sm">
                    <TableCaption className="text-muted-foreground">
                      User has {userDetails.documents.length} document(s)
                    </TableCaption>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-20 text-center">Files</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="w-24 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails.documents.map((doc: any) => (
                        <TableRow key={doc.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div 
                              className="font-semibold text-gray-900 group flex items-center cursor-pointer"
                              onClick={() => setViewingDocument(doc.id)}
                            >
                              <span className="group-hover:underline group-hover:text-primary transition-colors">
                                {doc.name || getDocumentDisplayName(doc)}
                              </span>
                              {hasDocumentFile(doc) && (
                                <Badge variant="secondary" className="ml-2 text-xs">Has File</Badge>
                              )}
                              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">
                              {doc.description || "No description"}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              {hasDocumentFile(doc) ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  1
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  0
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(doc.last_updated || doc.created_at || doc.updated_at)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setViewingDocument(doc.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* Controlled modal that shows when this document is selected */}
                            <ViewWillModal 
                              document={doc} 
                              isOpen={viewingDocument === doc.id} 
                              onClose={() => setViewingDocument(null)} 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
                  <p className="text-gray-600">
                    This user hasn't uploaded any documents yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}
