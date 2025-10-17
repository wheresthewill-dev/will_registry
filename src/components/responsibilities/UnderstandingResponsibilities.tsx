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
import { HelpCircle, ChevronUp, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import ResponsibilityItem from "./ResponsibilityItem";
import getResponsibilityInfo from "./ResponsibilityInfo";

interface ResponsibilityItemType {
  text: string;
}

interface UnderstandingResponsibilitiesProps {
  showResponsibilities: boolean;
  setShowResponsibilities: (show: boolean) => void;
}

export function UnderstandingResponsibilities({
  showResponsibilities,
  setShowResponsibilities,
}: UnderstandingResponsibilitiesProps) {
  return (
    <Card
      className={cn(
        "shadow-sm transition-all duration-500 ease-in-out",
        showResponsibilities
          ? "bg-primary/5 shadow-md"
          : "bg-primary/[0.02] hover:bg-primary/5"
      )}
    >
      <div
        className="flex items-center justify-between px-6 cursor-pointer transition-all duration-300 rounded-sm"
        onClick={() => setShowResponsibilities(!showResponsibilities)}
        aria-expanded={showResponsibilities}
        aria-controls="responsibility-details"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300",
              "text-primary border border-primary/20 bg-primary/10",
              showResponsibilities && "bg-primary/20 shadow-sm"
            )}
          >
            <HelpCircle
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                showResponsibilities && "scale-110"
              )}
            />
          </div>
          <div>
            <h2 className="text-lg font-medium flex items-center text-foreground/90">
              Understanding Your Responsibilities
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 text-xs bg-primary/10 text-primary hidden sm:inline-block",
                  "transition-all duration-300 border border-primary/20",
                  showResponsibilities && "bg-primary/20 text-primary"
                )}
              >
                Important information
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Learn about your duties as an Authorised Representative or
              Emergency Contact
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-primary hover:text-primary hover:bg-primary/5",
            "transition-all duration-300"
          )}
          aria-label={
            showResponsibilities
              ? "Hide responsibility details"
              : "Show responsibility details"
          }
        >
          {showResponsibilities ? "Hide details" : "Show details"}
          <div className="ml-1.5">
            {showResponsibilities ? (
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
          showResponsibilities
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0 transform translate-y-4"
        )}
        id="responsibility-details"
        aria-hidden={!showResponsibilities}
      >
        <div className="px-6 pt-2 pb-6 border-t border-primary/20">
          <div className="grid gap-6 md:grid-cols-2 mt-4">
            {Object.entries(getResponsibilityInfo()).map(
              ([key, info], index) => (
                <Card
                  key={key}
                  className={cn(
                    "transition-all duration-500",
                    showResponsibilities
                      ? "opacity-100 transform-none"
                      : "opacity-0 translate-y-6",
                    showResponsibilities && index === 0
                      ? "transition-delay-0"
                      : "",
                    showResponsibilities && index === 1
                      ? "transition-delay-150"
                      : ""
                  )}
                  style={{
                    transitionDelay: showResponsibilities
                      ? `${index * 150}ms`
                      : "0ms",
                  }}
                >
                  <CardHeader className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                        {info.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {info.title}
                        </CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 py-4">
                    <ul className="space-y-3">
                      {info.items.map(
                        (item: ResponsibilityItemType, index: number) => (
                          <ResponsibilityItem key={index} text={item.text} />
                        )
                      )}
                    </ul>
                  </CardContent>

                  <CardFooter className="border-t">
                    <div className="flex items-center gap-2 text-xs text-foreground/80">
                      <Info className="h-3.5 w-3.5 text-primary" />
                      <span>{info.footer}</span>
                    </div>
                  </CardFooter>
                </Card>
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default UnderstandingResponsibilities;
