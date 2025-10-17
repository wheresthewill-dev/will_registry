"use client";
import { useState } from "react";
import { helpCenterArticles } from "@/data/help-center-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export default function HelpCenterContent() {
  const [activeCategory, setActiveCategory] = useState(
    helpCenterArticles[0].category
  );

  const activeContent = helpCenterArticles.find(
    (item) => item.category === activeCategory
  );

  return (
    <div className="flex flex-row items-start gap-10 justify-start">
      <div className="shrink-0 w-48 flex flex-col space-y-2">
        {helpCenterArticles.map((tab) => (
          <Button
            key={tab.category}
            variant={activeCategory === tab.category ? "secondary" : "ghost"}
            className={cn(
              "justify-start px-4 py-2 text-left rounded-none",
              activeCategory === tab.category
                ? "bg-muted text-primary font-semibold border-l-4 border-primary"
                : "hover:bg-muted"
            )}
            onClick={() => setActiveCategory(tab.category)}
          >
            {tab.category}
          </Button>
        ))}
      </div>
      <div className="border-l border-gray-200 px-10 flex-1 max-w-4xl">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">{activeContent?.category}</h2>
          {activeContent?.articles.map((article, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-lg font-medium text-primary">
                {article.title}
              </h3>
              <ReactMarkdown>{article.body}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
