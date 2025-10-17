"use client";

// React and Next.js imports
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// UI components
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Custom components
import { NavUser } from "@/components/custom/nav-user";
import { UserAvatar } from "@/components/custom/user-avatar";
import { LoadingIndicator } from "@/components/custom/LoadingIndicator";
import ProtectedRoute from "@/components/protected-route";

// Hooks and utilities
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";
import { useUsers } from "../utils/repo_services/hooks/user";
import { isIdSegment, formatSegmentLabel } from "@/app/utils/breadcrumbUtils";
import { handleLogOut, useAuthStore } from "@/utils/authUtils";

// Constants
import { ICON_SIZES, SIDEBAR_ICONS } from "../constants/icons";
import { APP_LOGO_ICON, APP_TITLE } from "../constants/app.config";
import { ROUTES } from "../constants/routes";
import { AUTH_BUTTON_LABEL, SIDEBAR_LABEL } from "../constants/labels";
import Brand from "@/components/brand";

// Types and Interfaces
interface LoadingScreenProps {
  title: string;
  subtitle: string;
}

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

// Utility functions
function sidebarIsActive(href: string) {
  const pathname = usePathname();
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`/${href}`);
}

// Navigation data
const sidebarItems = [
  {
    title: SIDEBAR_LABEL.dashboard,
    href: ROUTES.dashboard,
    icon: <SIDEBAR_ICONS.dashboard className={ICON_SIZES.sm} />,
  },
  {
    title: SIDEBAR_LABEL.wills,
    href: ROUTES.wills,
    icon: <SIDEBAR_ICONS.wills className={ICON_SIZES.sm} />,
  },
  {
    title: SIDEBAR_LABEL.representatives,
    href: ROUTES.representatives,
    icon: <SIDEBAR_ICONS.representatives className={ICON_SIZES.sm} />,
  },
  {
    title: SIDEBAR_LABEL.emergencyContacts,
    href: ROUTES.emergencyContacts,
    icon: <SIDEBAR_ICONS.emergencyContacts className={ICON_SIZES.sm} />,
  },
  {
    title: SIDEBAR_LABEL.responsibilities,
    href: ROUTES.responsibilities,
    icon: <SIDEBAR_ICONS.responsibilities className={ICON_SIZES.sm} />,
  },
  {
    title: SIDEBAR_LABEL.subscription,
    href: ROUTES.subscription,
    icon: <SIDEBAR_ICONS.subscription className={ICON_SIZES.sm} />,
  },
];

// Define sidebar secondary base items
const sidebarSecondaryBase = [
  {
    title: SIDEBAR_LABEL.profile,
    href: ROUTES.profile,
    icon: <SIDEBAR_ICONS.profile className={ICON_SIZES.sm} />,
  },
  // {
  //   title: SIDEBAR_LABEL.help,
  //   href: ROUTES.help,
  //   icon: <SIDEBAR_ICONS.help className={ICON_SIZES.sm} />,
  // },
];

/**
 * LoadingScreen - Displays an animated loading screen with a logo and text
 */
function LoadingScreen({ title, subtitle }: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="relative bg-card text-card-foreground p-8 flex flex-col items-center space-y-8 w-full max-w-sm mx-auto">
        {/* Logo with animated ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full border-4 border-primary/10 animate-spin [animation-duration:3s]"></div>
          <div className="absolute w-16 h-16 rounded-full border-t-4 border-primary animate-spin [animation-duration:1.5s]"></div>
          <div className="z-10 rounded-full bg-background p-3 shadow-sm">
            <Image
              src={APP_LOGO_ICON}
              alt="Logo"
              width={40}
              height={40}
              className="relative animate-pulse"
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-medium text-foreground font-playfair">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Loading indicators */}
        <div className="flex space-x-2 justify-center items-center">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardSidebar - Sidebar navigation for the dashboard
 */
function DashboardSidebar({
  user,
  sidebarItems,
  sidebarSecondary,
}: {
  user: {
    firstname: string;
    lastname: string;
    fullname: string;
    email: string;
    profile_img: string;
  };
  sidebarItems: SidebarItem[];
  sidebarSecondary: SidebarItem[];
}) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 font-playfair font-semibold">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent"
            >
              <Brand showLogo href={ROUTES.dashboard} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item: SidebarItem) => {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={sidebarIsActive(item.href)}
                      size={"lg"}
                      className="hover:bg-sidebar-accent/50"
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 px-4 rounded-md"
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {sidebarSecondary.length > 0 && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarSecondary.map((item: SidebarItem) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      disabled={item.disabled}
                      size={"lg"}
                      className="hover:bg-sidebar-accent/50"
                      isActive={item.href !== "#" && sidebarIsActive(item.href)}
                    >
                      {item.onClick ? (
                        <button
                          onClick={item.onClick}
                          className={`flex items-center gap-2 px-4 rounded-md w-full text-left cursor-pointer ${
                            item.disabled
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:bg-gray-700"
                          }`}
                          disabled={item.disabled}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 px-4 hover:bg-gray-700 rounded-md cursor-pointer"
                        >
                          {item.icon}
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * DashboardNavbar - Top navigation with breadcrumbs
 */
function DashboardNavbar({
  user,
}: {
  user: {
    firstname: string;
    lastname: string;
    fullname: string;
    email: string;
    profile_img: string;
  };
}) {
  // Use Next.js hooks to get the current path
  const pathname = usePathname();

  // Generate breadcrumb segments from the current path
  const generateBreadcrumbItems = () => {
    if (!pathname) return [{ label: "Dashboard", href: ROUTES.dashboard }];

    // Split the path and remove empty segments
    const segments = pathname.split("/").filter(Boolean);

    // If we're at the dashboard root, just show Dashboard
    if (segments.length === 1 && segments[0] === "dashboard") {
      return [{ label: "Dashboard", href: ROUTES.dashboard }];
    }

    // Create breadcrumb items from path segments
    const breadcrumbItems = [{ label: "Dashboard", href: ROUTES.dashboard }];
    let currentPath = "";

    // Check if the last segment is an ID and exclude it if so
    const isLastSegmentId =
      segments.length > 1 && isIdSegment(segments[segments.length - 1]);
    const lastSegmentToProcess = isLastSegmentId
      ? segments.length - 1
      : segments.length;

    // Skip the first segment (dashboard) since it's already included
    for (let i = 1; i < lastSegmentToProcess; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      // Format the segment to be more readable (capitalize, replace dashes with spaces)
      const formattedLabel = formatSegmentLabel(segment);

      breadcrumbItems.push({
        label: formattedLabel,
        href: `/dashboard${currentPath}`,
      });
    }

    // If the last segment is an ID, we need to update the full path
    // but don't add a breadcrumb item for it
    if (isLastSegmentId) {
      const finalSegment = segments[segments.length - 1];
      currentPath += `/${finalSegment}`;
    }

    return breadcrumbItems;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  return (
    <nav className="shadow-xs border px-4 py-3 flex items-center">
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {index === breadcrumbItems.length - 1 ? (
                  // Last item is current page - don't make it a link
                  <span className="text-foreground font-semibold font-underline">
                    {item.label}
                  </span>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex ml-auto gap-2">
        <UserAvatar
          user={{
            firstname: user.firstname,
            lastname: user.lastname,
            profile_img: user.profile_img,
          }}
        />
      </div>
    </nav>
  );
}

/**
 * DashboardShell - Main dashboard layout wrapper
 */
function DashboardShell({ children }: { children: React.ReactNode }) {
  const { getCurrentUser, loading } = useUsers();
  const currentUser = getCurrentUser();
  const userRole: string = currentUser?.role || "";
  const { isAdmin, isSuperAdmin } = useUserSession();

  // Define admin sidebar items
  const adminSidebarItems = [
    {
      title: SIDEBAR_LABEL.dashboard,
      href: ROUTES.analytics,
      icon: <SIDEBAR_ICONS.dashboard className={ICON_SIZES.sm} />,
    },
    {
      title: SIDEBAR_LABEL.users,
      href: ROUTES.users,
      icon: <SIDEBAR_ICONS.users className={ICON_SIZES.sm} />,
    },
    {
      title: SIDEBAR_LABEL.finances,
      href: ROUTES.finances,
      icon: <SIDEBAR_ICONS.finances className={ICON_SIZES.sm} />,
    },
    {
      title: SIDEBAR_LABEL.pageSettings,
      href: ROUTES.pageSettings,
      icon: <SIDEBAR_ICONS.pageSettings className={ICON_SIZES.sm} />,
    },
  ];

  // Get the logout state from the store
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  // Build the secondary sidebar items
  const sidebarSecondary = [
    ...sidebarSecondaryBase,
    {
      title: isLoggingOut ? "Logging out..." : AUTH_BUTTON_LABEL.logout,
      href: "#",
      icon: isLoggingOut ? (
        <LoadingIndicator />
      ) : (
        <SIDEBAR_ICONS.logout className={ICON_SIZES.sm} />
      ),
      onClick: isLoggingOut ? undefined : handleLogOut,
      disabled: isLoggingOut,
    },
  ];

  // Extract the logout button which should be consistent across all user types
  const logoutButton = sidebarSecondary[sidebarSecondary.length - 1];

  // Determine which sidebar items to show based on user role
  let allowedSidebarItems = sidebarItems;
  let allowedSidebarSecondary = sidebarSecondaryBase;
  let showAdminSection = false;

  // Role-based sidebar configuration
  if (isAdmin || isSuperAdmin) {
    showAdminSection = true;
    allowedSidebarItems = [...adminSidebarItems];
    allowedSidebarSecondary = [];
  } else {
    allowedSidebarItems = [...sidebarItems]; // Regular user menu
  }

  // Always append the logout button as the last item in secondary menu
  allowedSidebarSecondary = [...allowedSidebarSecondary, logoutButton];

  // Fallback loading UI if user data is not ready
  if (loading || !currentUser) {
    return (
      <LoadingScreen
        title="Loading Dashboard"
        subtitle="Preparing your estate..."
      />
    );
  }

  // Compose user object for avatar and nav
  const userForNav = {
    firstname: currentUser.firstname ?? "",
    lastname: currentUser.lastname ?? "",
    fullname: `${currentUser.firstname ?? ""} ${currentUser.lastname ?? ""}`,
    email: currentUser.email ?? "",
    profile_img: currentUser.profile_img_url ?? "",
    role: userRole,
  };

  return (
    <SidebarProvider>
      <DashboardSidebar
        user={userForNav}
        sidebarItems={allowedSidebarItems}
        sidebarSecondary={allowedSidebarSecondary}
      />
      <div className="flex flex-col flex-1">
        <DashboardNavbar user={userForNav} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
        <Toaster position="bottom-center" richColors />
      </div>
    </SidebarProvider>
  );
}

/**
 * DashboardLayout - The main layout component for the dashboard
 * Handles authentication and provides the dashboard shell structure
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current path to determine if authentication is required
  // This is client-side, so we need to use window.location.pathname
  let isPublicRoute = false;
  let requireAuth = true;

  // Client-side path checking
  if (typeof window !== "undefined") {
    const path = window.location.pathname;

    // Define which dashboard routes should be publicly accessible
    // For example:
    const publicDashboardRoutes: string[] = [
      // Add paths that should be publicly accessible
      // For example: '/dashboard/public-stats'
    ];

    // Check if current path is in the public routes
    isPublicRoute = publicDashboardRoutes.some((route) =>
      path.startsWith(route)
    );

    // Special handling for payment routes
    const paymentRoutes = [
      "/dashboard/subscription/success",
      "/dashboard/subscription/cancel",
    ];
    const isPaymentRoute = paymentRoutes.some((route) =>
      path.startsWith(route)
    );

    // Don't require auth for public routes and payment routes (they have special handling)
    requireAuth = !isPublicRoute && !isPaymentRoute;

    // Add a handler for when the browser tab becomes visible again
    const handleVisibilityChange = () => {
      // Refresh the page if it's been inactive for a while (over 10 minutes)
      if (document.visibilityState === "visible") {
        const lastActive = parseInt(
          sessionStorage.getItem("lastActiveTime") || "0"
        );
        const now = Date.now();
        const inactiveTime = now - lastActive;

        // If inactive for more than 10 minutes, refresh the page
        if (lastActive > 0 && inactiveTime > 600000) {
          // 10 minutes
          window.location.reload();
        } else {
          // Update last active time
          sessionStorage.setItem("lastActiveTime", now.toString());
        }
      } else if (document.visibilityState === "hidden") {
        // When tab becomes hidden, store the timestamp
        sessionStorage.setItem("lastActiveTime", Date.now().toString());
      }
    };

    // Set initial last active time
    sessionStorage.setItem("lastActiveTime", Date.now().toString());

    // Add event listener for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  return (
    <ProtectedRoute
      requireAuth={requireAuth}
      publicAccessible={isPublicRoute}
      fallback={
        <LoadingScreen
          title="Authenticating"
          subtitle="Verifying your access..."
        />
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
