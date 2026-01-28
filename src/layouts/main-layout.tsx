import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ChatbotSelector } from "@/components/chatbot-selector";
import { useAuthStore } from "@/store/auth";

export function MainLayout() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
      <SidebarInset className="relative">
        <header
          id="app-header"
          className="flex px-4 sticky bg-background top-0 z-50 w-full h-16 shrink-0 items-center gap-4 shadow-md"
        >
          <SidebarTrigger className="-ml-1 border-[1px]" />
          <div className="flex-1"></div>
          {isAuthenticated && <ChatbotSelector />}
          {/* <LanguageSwicher />
          <div className="w-2"></div>
          <ModeToggle /> */}
        </header>
        <div className="bg-background">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
