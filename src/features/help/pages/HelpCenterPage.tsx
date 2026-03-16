import { useTranslation } from "react-i18next";
import { BookOpen, Keyboard, LifeBuoy, Compass, MessageCircleQuestion } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

export function HelpCenterPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const roleLevel = useMemo(() => {
    const roles = user?.roles || [];
    const isAdmin = roles.some((r) => r.name?.toUpperCase() === "ADMIN");
    if (isAdmin) return "admin";
    const isManager = roles.some((r) => r.name?.toUpperCase() === "MANAGER");
    if (isManager) return "manager";
    return "user";
  }, [user?.roles]);

  return (
    <div className="admin-page">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("Help Center")}</h1>
          <p className="text-muted-foreground">{t("Find guides, support options, and useful shortcuts")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Compass className="h-4 w-4 text-blue-600" />
                {t("Get Started")}
              </CardTitle>
              <CardDescription>{t("Core navigation and daily workflow")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t("Use the left sidebar to switch modules: Intents, Entities, Actions, Rules, Stories, and Documents.")}</p>
              <p>{t("Use the top-right question mark icon for quick contextual help on any page.")}</p>
              <p>{t("Open Settings to change language and theme for the whole app.")}</p>
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Keyboard className="h-4 w-4 text-violet-600" />
                {t("Keyboard Shortcuts")}
              </CardTitle>
              <CardDescription>{t("Speed up common actions")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t("Ctrl + / opens the keyboard shortcuts dialog")}</p>
              <p>{t("Enter sends chat messages")}</p>
              <p>{t("Shift + Enter inserts a new line")}</p>
              <p>{t("Esc closes most dialogs and popovers")}</p>
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                {t("Learn More")}
              </CardTitle>
              <CardDescription>{t("Module-specific guidance")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t("Create and maintain NLU resources from Intents, Entities, Responses, and Rules.")}</p>
              <p>{t("Use Action editor for custom Python logic and syntax validation.")}</p>
              <p>{t("Use import/export tools for fast onboarding and migration.")}</p>
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900/60">
                <p className="mb-1 font-medium text-foreground">{t("Role-based tips")}</p>
                {roleLevel === "admin" && (
                  <ul className="space-y-1">
                    <li>{t("Admin: manage users, roles, permissions, and system-wide training flows.")}</li>
                    <li>{t("Admin: review statistics dashboards to monitor quality and usage.")}</li>
                  </ul>
                )}
                {roleLevel === "manager" && (
                  <ul className="space-y-1">
                    <li>{t("Manager: maintain data modules, documents, and context resources.")}</li>
                    <li>{t("Manager: coordinate content updates before training and deployment.")}</li>
                  </ul>
                )}
                {roleLevel === "user" && (
                  <ul className="space-y-1">
                    <li>{t("User: focus on chatting, searching documents, and feedback loops.")}</li>
                    <li>{t("User: use Help Center shortcuts to work faster with daily tasks.")}</li>
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-4 w-4 text-orange-600" />
                {t("Get Help")}
              </CardTitle>
              <CardDescription>{t("Support and troubleshooting")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{t("Need more support? Contact your system administrator or support team.")}</p>
              <a href="mailto:support@example.com" className="inline-block">
                <Button size="sm" variant="outline" className="gap-2">
                  <MessageCircleQuestion className="h-4 w-4" />
                  {t("Contact Support")}
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
