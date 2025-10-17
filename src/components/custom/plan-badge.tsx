import React from "react";

interface BadgeProps {
  variant: "bronze" | "silver" | "gold" | "platinum";
}

const PlanBadge: React.FC<BadgeProps> = ({ variant }) => {
  const variants = {
    bronze: {
      style: "bg-gradient-to-r from-amber-700 to-yellow-600 text-white",
      name: "Bronze Plan",
    },
    silver: {
      style: " bg-gradient-to-r from-zinc-400 to-gray-300 text-gray-900 ",
      name: "Silver Plan",
    },
    gold: {
      style: "bg-gradient-to-r from-yellow-500 to-amber-400 text-white",
      name: "Gold Plan",
    },
    platinum: {
      style: "bg-gradient-to-r from-gray-100 to-zinc-300 text-gray-800",
      name: "Platinum Plan",
    },
  };

  return (
    <span
      className={`px-6 py-1 rounded-sm text-xs font-semibold shadow-sm ${variants[variant].style}`}
    >
      {variants[variant].name}
    </span>
  );
};

export default PlanBadge;
