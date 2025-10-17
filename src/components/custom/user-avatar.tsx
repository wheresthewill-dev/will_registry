import { getUserInitials } from "@/utils/getUserInitials";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import clsx from "clsx";

type UserAvatarProps = {
  user: {
    firstname: string;
    lastname: string;
    profile_img?: string;
  };
  size?: "default" | "large" | "small";
  className?: string;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "default",
  className,
}) => {
  const sizeClasses = {
    default: "h-8 w-8",
    small: "h-6 w-6",
    large: "h-24 w-24",
  };

  return (
    <div className="bg-secondary rounded-full">
      <Avatar
        className={clsx(
          sizeClasses[size],
          "flex items-center justify-center",
          className
        )}
      >
        <AvatarImage
          src={user.profile_img}
          alt={`${user.firstname} ${user.lastname}`}
          className="object-cover w-full h-full rounded-sm"
        />

        <AvatarFallback className="flex items-center justify-center text-center w-full h-full">
          <span className="inline-flex items-center justify-center text-sm font-normal">
            {getUserInitials(user.firstname, user.lastname)}
          </span>
        </AvatarFallback>
      </Avatar>
    </div>
  );
};
