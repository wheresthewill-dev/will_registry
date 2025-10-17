import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronUp, ChevronDown, Info, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsibilityItem } from "@/components/responsibilities/ResponsibilityItem";

interface UnderstandingContentProps {
  showContent: boolean;
  setShowContent: (show: boolean) => void;
  title: string;
  subtitle: string;
  items: { text: string }[];
  icon: React.ReactNode;
  cardTitle: string;
  cardDescription: string;
  footer: string;
}

export function UnderstandingContent({
  showContent,
  setShowContent,
  title,
  subtitle,
  items,
  icon,
  cardTitle,
  cardDescription,
  footer,
}: UnderstandingContentProps) {
  return (
    <Card
      className={cn(
        "shadow-sm transition-all duration-500 ease-in-out",
        showContent
          ? "bg-primary/5 shadow-md"
          : "bg-primary/[0.02] hover:bg-primary/5"
      )}
    >
      <div
        className="flex items-center justify-between px-6 cursor-pointer transition-all duration-300 rounded-sm"
        onClick={() => setShowContent(!showContent)}
        aria-expanded={showContent}
        aria-controls="content-details"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300",
              "text-primary border border-primary/20 bg-primary/10",
              showContent && "bg-primary/20 shadow-sm"
            )}
          >
            <HelpCircle
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                showContent && "scale-110"
              )}
            />
          </div>
          <div>
            <h2 className="text-lg font-medium flex items-center text-foreground/90">
              {title}
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 text-xs bg-primary/10 text-primary hidden sm:inline-block",
                  "transition-all duration-300 border border-primary/20",
                  showContent && "bg-primary/20 text-primary"
                )}
              >
                Important information
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-primary hover:text-primary hover:bg-primary/5",
            "transition-all duration-300"
          )}
          aria-label={showContent ? "Hide details" : "Show details"}
        >
          {showContent ? "Hide details" : "Show details"}
          <div className="ml-1.5">
            {showContent ? (
              <ChevronUp className="h-4 w-4 animate-pulse text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )}
          </div>
        </Button>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          showContent
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0 transform translate-y-4"
        )}
        id="content-details"
        aria-hidden={!showContent}
      >
        <div className="px-6 pt-2 pb-6 border-t border-primary/20">
          <div className="mt-4">
            <Card>
              <CardHeader className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                    {icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{cardTitle}</CardTitle>
                    <CardDescription>{cardDescription}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-5 py-4">
                <ul className="space-y-3">
                  {items.map((item, index) => (
                    <ResponsibilityItem key={index} text={item.text} />
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="border-t">
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>{footer}</span>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Understanding representatives component
export function UnderstandingRepresentatives({
  showContent,
  setShowContent,
}: {
  showContent: boolean;
  setShowContent: (show: boolean) => void;
}) {
  return (
    <UnderstandingContent
      showContent={showContent}
      setShowContent={setShowContent}
      title="Understanding Authorized Representatives"
      subtitle="Learn about what representatives are and how they work"
      icon={<Users className="h-5 w-5 text-foreground" />}
      cardTitle="About Authorised Representatives"
      cardDescription="Representatives act on your behalf in certain situations"
      items={[
        { text: "Access and manage your estate documents" },
        { text: "Execute your wishes when you are unable to" },
        { text: "Represent your interests in legal matters" },
        { text: "Maintain confidentiality of your information" },
      ]}
      footer="Choose representatives you trust completely"
    />
  );
}
