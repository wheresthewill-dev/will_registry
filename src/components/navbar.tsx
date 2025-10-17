"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTH_BUTTON_LABEL } from "@/app/constants/labels";
import { ROUTES } from "@/app/constants/routes";
import { handleLogOut } from "@/utils/authUtils";
import { ICON_SIZES } from "@/app/constants/icons";
import { APP_LOGO_ICON } from "@/app/constants/app.config";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Accordion } from "@/components/ui/accordion";
import { LANDING_PAGE_NAVIGATION } from "@/app/constants/navigation";
import Brand from "./brand";

// Get initial of user's name
const getUserInitials = (user: any) => {
  if (!user) return "U";
  const email = user.email || "";
  const parts = email.split("@")[0].split(".");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : email.substring(0, 2).toUpperCase();
};

// Get user display name from email
const getUserDisplayName = (user: any) => {
  if (!user) return "User";
  return user.email?.split("@")[0] || "User";
};

// Smooth scroll configuration
const SCROLL_CONFIG = {
  behavior: "smooth" as const,
  offsetTop: 80,
  duration: 800,
  easing: "ease-in-out",
};

// Debounce utility for performance
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Enhanced smooth scroll with section detection
const smoothScrollToSection = (
  sectionId: string,
  router: any,
  pathname: string | null,
  setIsOpen?: (open: boolean) => void
) => {
  // Close mobile menu immediately
  if (setIsOpen) setIsOpen(false);

  // If not on home page, navigate to home first
  if (pathname !== "/") {
    router.push("/");
    // Wait for navigation to complete, then scroll
    setTimeout(() => {
      performSmoothScroll(sectionId);
    }, 100);
    return;
  }

  // Perform smooth scroll on current page
  performSmoothScroll(sectionId);
};

// Core smooth scroll implementation
const performSmoothScroll = (sectionId: string) => {
  requestAnimationFrame(() => {
    try {
      let targetElement = document.getElementById(sectionId);

      // Fallback: try to find section by data attributes or class names
      if (!targetElement) {
        targetElement =
          document.querySelector(`[data-section="${sectionId}"]`) ||
          document.querySelector(`.${sectionId}-section`) ||
          document.querySelector(`section.${sectionId}`);
      }

      // Special handling for top/home section
      if (!targetElement && (sectionId === "home" || sectionId === "hero")) {
        window.scrollTo({
          top: 0,
          behavior: SCROLL_CONFIG.behavior,
        });
        // Clean URL without hash
        if (window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        return;
      }

      if (!targetElement) {
        console.warn(
          `Section "${sectionId}" not found. Available sections:`,
          Array.from(document.querySelectorAll("section")).map(
            (s) => s.id || s.className
          )
        );
        return;
      }

      // Calculate scroll position
      const navbar = document.querySelector("nav");
      const navbarHeight = navbar
        ? navbar.getBoundingClientRect().height
        : SCROLL_CONFIG.offsetTop;
      const elementRect = targetElement.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const targetPosition = Math.max(
        0,
        absoluteElementTop - navbarHeight - 10
      );

      // Perform smooth scroll
      if ("scrollBehavior" in document.documentElement.style) {
        window.scrollTo({
          top: targetPosition,
          behavior: SCROLL_CONFIG.behavior,
        });
      } else {
        // Fallback for older browsers
        smoothScrollPolyfill(targetPosition);
      }

      // Clean URL without showing hash
      if (window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    } catch (error) {
      console.error("Error during smooth scroll:", error);
      // Fallback to top of page
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
};

// Smooth scroll polyfill for older browsers
const smoothScrollPolyfill = (targetPosition: number) => {
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const duration = SCROLL_CONFIG.duration;
  let start: number | null = null;

  const step = (timestamp: number) => {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const percentage = Math.min(progress / duration, 1);

    // Easing function
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    const currentPosition =
      startPosition + distance * easeInOutCubic(percentage);
    window.scrollTo(0, currentPosition);

    if (progress < duration) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

// Extract section ID from href
const getSectionIdFromHref = (href: string): string | null => {
  if (!href.startsWith("/#")) return null;
  const navItem = LANDING_PAGE_NAVIGATION.find((item) => item.href === href);
  if (navItem) {
    return navItem.href.substring(2);
  }
  return href.substring(2);
};

// Enhanced navigation handler
const handleNavigationClick = (
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  router: any,
  pathname: string,
  setIsOpen?: (open: boolean) => void
) => {
  e.preventDefault();

  // Handle external links normally
  if (href.startsWith("http") || href === "/help-center") {
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href);
    }
    if (setIsOpen) setIsOpen(false);
    return;
  }

  // Handle section navigation
  const sectionId = getSectionIdFromHref(href);
  if (sectionId) {
    smoothScrollToSection(sectionId, router, pathname, setIsOpen);
  } else {
    // Handle regular internal navigation
    router.push(href);
    if (setIsOpen) setIsOpen(false);
  }
};

// Hook for scroll enhancements and section detection
const useScrollEnhancements = (pathname: string | null) => {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    // Add smooth scrolling CSS
    const htmlElement = document.documentElement;
    htmlElement.style.scrollBehavior = "smooth";

    // Intersection Observer for active section detection
    const observerOptions = {
      root: null,
      rootMargin: "-80px 0px -50% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId =
            entry.target.id ||
            entry.target.getAttribute("data-section") ||
            entry.target.className
              .split(" ")
              .find((c) => c.endsWith("-section"))
              ?.replace("-section", "");
          if (sectionId) {
            setActiveSection(sectionId);
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll(
      "section, [data-section], .hero, .features, .pricing, .about, .contact"
    );
    sections.forEach((section) => observer.observe(section));

    // Handle browser navigation (back/forward)
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash) {
        const sectionId = getSectionIdFromHref(hash);
        if (sectionId) {
          setTimeout(() => performSmoothScroll(sectionId), 100);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Debounced scroll handler
    const debouncedScrollHandler = debounce(() => {
      // Additional scroll-based logic if needed
    }, 16);

    window.addEventListener("scroll", debouncedScrollHandler, {
      passive: true,
    });

    return () => {
      htmlElement.style.scrollBehavior = "";
      observer.disconnect();
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("scroll", debouncedScrollHandler);
    };
  }, [pathname]);

  return { activeSection };
};

export default function Navbar({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = !!user;

  // Apply scroll enhancements
  const { activeSection } = useScrollEnhancements(pathname);

  // Enhanced mobile menu handler
  const handleMobileMenuClick = useCallback(
    (item: MenuItem) => {
      const mockEvent = {
        preventDefault: () => {},
      } as unknown as React.MouseEvent<HTMLAnchorElement>;
      handleNavigationClick(
        mockEvent,
        item.href,
        router,
        pathname || "",
        setIsOpen
      );
    },
    [router, pathname]
  );

  // Brand click handler
  const handleBrandClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      handleNavigationClick(e, "/#home", router, pathname || "", setIsOpen);
    },
    [router, pathname]
  );

  return (
    <nav className="relative z-50 bg-white shadow-sm">
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        <Brand
          className="text-sm md:text-lg"
          showLogo
          href="#home"
          onClick={handleBrandClick}
        />
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center ml-10">
          <NavigationMenu>
            <NavigationMenuList className="space-x-6">
              {LANDING_PAGE_NAVIGATION.map((item) =>
                renderDesktopMenuItem(item, router, pathname, setIsOpen)
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Authenticated Desktop Actions */}
        {isLoggedIn ? (
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* TODO: get user firstname and lastname */}
                <Button variant="secondary" className="relative h-10 w-10">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user?.avatar_url}
                      alt={getUserDisplayName(user)}
                    />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={ROUTES.dashboard}
                    className="flex items-center cursor-pointer"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{AUTH_BUTTON_LABEL.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="hidden lg:flex space-x-4 ml-auto">
            <Link href={ROUTES.login}>
              <Button variant="outline" className="text-sm">
                {AUTH_BUTTON_LABEL.login}
              </Button>
            </Link>
            <Link href={ROUTES.register}>
              <Button className="text-sm">{AUTH_BUTTON_LABEL.register}</Button>
            </Link>
          </div>
        )}

        {/* Mobile Hamburger Menu */}
        <div className="block lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className={ICON_SIZES.sm} />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex-shrink-0">
                    <a
                      href={ROUTES.home}
                      className="flex"
                      onClick={handleBrandClick}
                    >
                      <img
                        src={APP_LOGO_ICON}
                        className="max-h-8 dark:invert"
                        alt="App Logo"
                      />
                    </a>
                  </SheetTitle>
                </div>
              </SheetHeader>
              <div className="flex flex-col gap-6 p-4">
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-full flex-col gap-4"
                >
                  {LANDING_PAGE_NAVIGATION.map((item) =>
                    renderMobileMenuItem(item, handleMobileMenuClick)
                  )}
                </Accordion>
                <div className="flex flex-col gap-3">
                  <Button asChild variant="outline">
                    <Link href={ROUTES.login}>{AUTH_BUTTON_LABEL.login}</Link>
                  </Button>
                  <Button asChild>
                    <Link href={ROUTES.register}>
                      {AUTH_BUTTON_LABEL.register}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

interface MenuItem {
  label: string;
  href: string;
}

const renderMobileMenuItem = (
  item: MenuItem,
  handleClick: (item: MenuItem) => void
) => {
  return (
    <button
      key={item.label}
      onClick={() => handleClick(item)}
      className={cn(
        "text-md font-light font-playfair text-left w-full py-3 px-2 rounded transition-all duration-200"
      )}
    >
      {item.label}
    </button>
  );
};

const renderDesktopMenuItem = (
  item: MenuItem,
  router: any,
  pathname: string | null,
  setIsOpen: (open: boolean) => void
) => {
  return (
    <NavigationMenuItem key={item.label}>
      <button
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          handleNavigationClick(
            e as unknown as React.MouseEvent<HTMLAnchorElement>,
            item.href,
            router,
            pathname || "",
            setIsOpen
          )
        }
        className={cn(
          "text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 cursor-pointer"
        )}
      >
        {item.label}
      </button>
    </NavigationMenuItem>
  );
};
