import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChatbotSelector } from "@/components/chatbot-selector";
import { useAuthStore } from "@/store/auth";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { GlobalHelpPopover } from "@/components/global-help-popover";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { AppChatHeaderInfo } from "@/features/chat/components/AppChatHeaderInfo";
import { useChatbots } from "@/hooks/useChatbots";

export function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  useChatbots();
  const isAdmin = Boolean(
    user?.roles?.some((role) => role.name?.toUpperCase() === "ADMIN")
  );
  // Ẩn bộ chọn chatbot ở trang chat vì trang chat dùng system chatbot được cấu hình trong Settings
  const isChatPage = location.pathname === "/" || location.pathname === "/home_chat" || location.pathname === "/home_chat_demo";

  // Yêu cầu quyền hiển thị Notification khi load lần đầu
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // if (!user) return <Navigate to="/public_chat" />;
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative min-w-0 overflow-x-hidden">
        <KeyboardShortcutsDialog />
        <header
          id="app-header"
          className="sticky top-0 z-50 flex h-16 w-full min-w-0 shrink-0 items-center gap-3 overflow-x-clip border-b border-border/70 bg-background/95 px-4 backdrop-blur"
        >
          <SidebarTrigger className="-ml-1 border-[1px]" />
          <div className="min-w-0 flex-1">
            <AppChatHeaderInfo />
          </div>
          {isAuthenticated && isAdmin && !isChatPage && <ChatbotSelector />}
          <GlobalHelpPopover />
          <ThemeModeToggle />
          {/* <LanguageSwicher />
          <div className="w-2"></div>
          <ModeToggle /> */}
        </header>
        <div className="min-h-[calc(100svh-4rem)] w-full min-w-0 overflow-x-hidden bg-background">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
