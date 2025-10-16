import { useNavigate } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { BadgeCheck, ChevronsUpDown, LogIn, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuthStore } from "@/store/auth";
import { useMe } from "@/hooks/useMe";

export function NavUser() {
  const { isMobile } = useSidebar();
  // const { user } = useAuthStore();
  const { user } = useMe();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  if (!user) {
    console.log("user null");
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => navigate("/auth")}
            className="gap-2 text-sm font-medium border border-border rounded-md px-3 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <LogIn className="size-4" />
            Đăng nhập
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Nếu đã đăng nhập → Hiện dropdown người dùng
  console.log("user info when login", user);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.firstName} />
                <AvatarFallback className="rounded-lg">
                  {user.firstName ? user.firstName[0] : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.firstName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.firstName} />
                  <AvatarFallback className="rounded-lg">
                    {user.firstName ? user.firstName[0] : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.firstName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/*<DropdownMenuGroup>*/}
            {/*  <DropdownMenuItem>*/}
            {/*    <Sparkles />*/}
            {/*    Upgrade to Pro*/}
            {/*  </DropdownMenuItem>*/}
            {/*</DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/user-profile")}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              {/*<DropdownMenuItem>*/}
            {/*  <CreditCard />*/}
            {/*  Billing*/}
            {/*</DropdownMenuItem>*/}
            {/*<DropdownMenuItem>*/}
            {/*  <Bell />*/}
            {/*  Notifications*/}
            {/*</DropdownMenuItem>*/}
            {/* </DropdownMenuGroup> */}
            {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <BadgeCheck />
              Account
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={async () => {
                await logout();
                // setTimeout(() => {
                //   window.location.reload();
                // }, 500);
                setTimeout(() => {
                  navigate("/auth");
                }, 500);
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
