import React from "react";
import { FileText } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
interface InfoCardProps {
  title: string;
  description: string;
  count: number | string;
  lastUpdated: string;
  buttonText: string;
  buttonLink: string;
  icon: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  count,
  lastUpdated,
  buttonText,
  buttonLink = "#",
  icon = <FileText className="h-5 w-5" aria-hidden="true" />,
}) => {
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg flex items-center justify-between">
          {title}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <span className="flex items-center justify-center w-5 h-5">
              {icon}
            </span>
          </div>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl md:text-3xl font-bold">{count}</div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Last Updated: {lastUpdated}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          variant="default"
          size="lg"
          className="w-full text-xs md:text-sm"
          onClick={
            buttonLink ? () => (window.location.href = buttonLink) : undefined
          }
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InfoCard;
