import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar";
import { Bot, MessageCircleCode, ShieldCheck, UserCog } from "lucide-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  //   const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  //   const infoUser = {
  //     name: user?.name || "",
  //     email: user?.email || "",
  //     avatar: user?.avatar || "",
  //   };

  const data = React.useMemo(() => {
    return {
      //   user: {
      //     name: infoUser.name,
      //     email: infoUser.email,
      //     avatar: infoUser.avatar,
      //   },

      navMain: [
        {
          title: "Models",
          url: "#",
          icon: Bot,
          hidden: false,
          items: [
            {
              title: "Training",
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
            {
              title: "Chat Bot",
              url: "/chat_bot",
            },
            {
              title: "UQuestion",
              url: "/uquestion",
            },
          ],
        },
        // {
        //   title: t("Documents & Forms"),
        //   url: "/docs",
        //   icon: BookOpen,
        //   hidden: false,
        //   items: [
        //     {
        //       title: t("Categories"),
        //       url: "/categories",
        //     },
        //     {
        //       title: t("Forms"),
        //       url: "/forms",
        //     },
        //     {
        //       title: t("Documents"),
        //       url: "/docs",
        //     },
        //     {
        //       title: t("Analytics & Reports"),
        //       url: "/doc-analytics",
        //     },
        //   ],
        // },
        {
          title: "RBAC",
          icon: ShieldCheck,
          hidden: false,
          items: [
            {
              title: t("Roles"),
              url: "roles",
            },
            {
              title: t("Permissions"),
              url: "permissions",
            },
          ],
        },
        {
          title: t("Users Management"),
          icon: UserCog,
          hidden: false,
          items: [
            {
              title: t("Users"),
              url: "users",
            },
          ],
        },
        // {
        //   title: t("Settings"),
        //   icon: Settings2,
        //   hidden: false,
        //   items: [],
        // },
      ],
    };
  }, [t]);
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
            src="/logo.png"
            alt="@logo"
            className="h-10 w-10 rounded-full shadow-lg"
          />
          <span
            className="font-semibold text-xl"
            style={{ fontFamily: "'audiowide', 'Orbitron', sans-serif" }}
          >
            Rasa Chatbot
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
