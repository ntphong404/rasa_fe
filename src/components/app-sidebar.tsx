import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar";
import { BookOpen, Bot, MessageCircleCode, ShieldCheck, UserCog, MessageSquare, Settings, CircleHelp } from "lucide-react";
import { NavMain } from "./nav-main";
import { NavConversations } from "./nav-conversations";
import { NavUser } from "./nav-user";
import { useAuthStore } from "@/store/auth";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Check if user has admin role
  const isAdmin = React.useMemo(() => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.name.toUpperCase() === 'ADMIN'
    );
  }, [user?.roles]);

  // Check if user has manager role
  const isManager = React.useMemo(() => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.name.toUpperCase() === 'MANAGER'
    );
  }, [user?.roles]);

  // Get user's highest role level: admin > manager > user
  const userRoleLevel = React.useMemo(() => {
    if (isAdmin) return 'admin';
    if (isManager) return 'manager';
    return 'user';
  }, [isAdmin, isManager]);

  //   const infoUser = {
  //     name: user?.name || "",
  //     email: user?.email || "",
  //     avatar: user?.avatar || "",
  //   };

  const data = React.useMemo(() => {
    // Define which roles can see each menu section
    // 'admin' = only admin, 'manager' = manager + admin, 'user' = everyone
    const navMainFull = [
      {
        title: t("General"),
        icon: Bot,
        hidden: false,
        allowedRoles: ['manager', 'admin'], // Manager and Admin can see
        items: [
          { title: t("Add data"), url: "/add-data" },
          { title: t("View details"), url: "/data-info" },
        ]
      },
      {
        title: t("Expert"),
        url: "#",
        icon: Bot,
        hidden: false,
        allowedRoles: ['manager', 'admin'], // Manager and Admin can see
        items: [
          {
            title: t("Training"),
            url: "/training",
          },
          {
            title: "Intents",
            url: "/intents",
          },
          {
            title: "Entities",
            url: "/entities",
          },
          {
            title: "Actions",
            url: "/actions",
          },
          {
            title: "Responses",
            url: "/responses",
          },
          {
            title: "Rules",
            url: "/rules",
          },
          { title: "Stories", url: "/stories" },
          // {
          //   title: "Slots",
          //   url: "/slots",
          // },
          ...(userRoleLevel === 'admin'
            ? [
              {
                title: "Chatbot",
                url: "/chat_bot",
              },
            ]
            : []),
          {
            title: "UQuestion",
            url: "/uquestion",
          },
          {
            title: t("Message Feedback"),
            url: "/message-feedback",
          },
        ],
      },
      {
        title: t("Documents & Forms"),
        url: "/docs",
        icon: BookOpen,
        hidden: false,
        allowedRoles: ['manager', 'admin'], // Manager and Admin can see
        items: [
          {
            title: t("Documents"),
            url: "/docs",
          },
          ...(userRoleLevel === 'admin'
            ? [
              {
                title: t("Context documents"),
                url: "/context-docs",
              },
            ]
            : []),
        ],
      },
      {
        title: t("Statistics reports"),
        icon: MessageSquare,
        hidden: false,
        allowedRoles: ['admin'], // Only Admin can see
        items: [
          {
            title: t("Users"),
            url: "/statistics/users",
          },
          {
            title: t("Conversations"),
            url: "/statistics/conversations",
          },
          {
            title: "Chatbot",
            url: "/statistics/chatbots",
          },
          {
            title: "NLP",
            url: "/statistics/nlp",
          },
          {
            title: t("Documents"),
            url: "/statistics/documents",
          },
        ],
      },
      {
        title: "RBAC",
        icon: ShieldCheck,
        hidden: false,
        allowedRoles: ['admin'], // Only Admin can see
        items: [
          {
            title: t("Roles"),
            url: "/roles",
          },
          {
            title: t("Permissions"),
            url: "/permissions",
          },
        ],
      },
      {
        title: t("Users Management"),
        icon: UserCog,
        hidden: false,
        allowedRoles: ['admin'], // Only Admin can see
        items: [
          {
            title: t("Users"),
            url: "/users",
          },
        ],
      },
      // {
      //   title: t("Settings"),
      //   icon: Settings2,
      //   hidden: false,
      //   items: [],
      // },
    ];

    // Filter navMain based on user's role
    const navMain = navMainFull.filter(item => {
      if (userRoleLevel === 'admin') return true; // Admin sees everything
      if (userRoleLevel === 'manager') {
        return item.allowedRoles.includes('manager');
      }
      return false; // User role sees nothing in navMain
    });

    return { navMain };
  }, [t, userRoleLevel]);
  console.log("Sidebar data:", data.navMain);
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader
        onClick={() => {
          navigate("/home_chat");
        }}
        className="px-4 flex items-center py-3 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <img
            src="/logo2.png"
            alt="@logo"
            className="h-10 w-10 rounded-full shadow-lg"
          />
          <span
            className="font-semibold text-xl"
            style={{ fontFamily: "'audiowide', 'Orbitron', sans-serif" }}
          >
            KMA Chatbot
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  to="/"
                  className="transition-all duration-200 transform hover:translate-x-1"
                >
                  <MessageCircleCode size={24} />
                  <span>{t("Chat with Rasa")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {isAuthenticated && (isAdmin || isManager) && <NavMain items={data.navMain} />}
        {isAuthenticated && <NavConversations />}
        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("System")}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/settings"
                    className="transition-all duration-200 transform hover:translate-x-1"
                  >
                    <Settings size={18} />
                    <span>{t("Settings")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/help"
                    className="transition-all duration-200 transform hover:translate-x-1"
                  >
                    <CircleHelp size={18} />
                    <span>{t("Help Center")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        {/* 'Thêm dữ liệu' is now inside Models (NavMain) */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
