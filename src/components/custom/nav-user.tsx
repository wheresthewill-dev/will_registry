"use client";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { UserAvatar } from "./user-avatar";
import { Button } from "../ui/button";

export function NavUser({
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
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <div className="row-span-1 flex w-full items-center gap-4 px-2">
            <UserAvatar
              user={{
                firstname: user.firstname,
                lastname: user.lastname,
                profile_img: user.profile_img,
              }}
            ></UserAvatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.fullname}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
