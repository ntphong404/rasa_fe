import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Bot, Globe, Keyboard, LifeBuoy, MonitorCog, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import i18n, { setLanguage } from "@/locales/i18n";
import toast from "react-hot-toast";
import { useChatbots } from "@/hooks/useChatbots";
import { useAuthStore } from "@/store/auth";
import { useChatbotStore } from "@/store/chatbot";
import { authService } from "@/features/auth/api/service";

type AppLanguage = "vi" | "en";
type ThemeOption = "light" | "dark" | "system";

export function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const { chatbots } = useChatbots();
  const selectedChatBotId = useChatbotStore((state) => state.selectedChatBotId);
  const selectedChatbotObjectId = useChatbotStore((state) => state.selectedChatbotObjectId);
  const setSelectedChatBotId = useChatbotStore((state) => state.setSelectedChatBotId);
  const [systemChatbotId, setSystemChatbotId] = useState<string | null>(null);
  const [systemChatbotObjectId, setSystemChatbotObjectId] = useState<string | null>(null);
  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => role.name?.toUpperCase() === "ADMIN")),
    [user?.roles]
  );
  const [language, setLanguageState] = useState<AppLanguage>(
    i18n.language === "en" ? "en" : "vi"
  );

  useEffect(() => {
    if (!isAdmin) return;

    const loadSystemChatbot = async () => {
      try {
        const response = await authService.getSystemChatbot();
        setSystemChatbotId(response.systemChatbotId || null);
        setSystemChatbotObjectId(response.chatbotId || null);

        if (response.systemChatbotId && response.chatbotId) {
          setSelectedChatBotId(response.systemChatbotId, response.chatbotId);
        }
      } catch (error) {
        console.error("Failed to load system chatbot setting:", error);
      }
    };

    loadSystemChatbot();
  }, [isAdmin, setSelectedChatBotId]);

  const handleLanguageChange = async (value: AppLanguage) => {
    await i18n.changeLanguage(value);
    setLanguage(value);
    setLanguageState(value);
    toast.success(t("Settings updated"));
  };

  const handleThemeChange = (value: ThemeOption) => {
    setTheme(value);
    toast.success(t("Settings updated"));
  };

  const handleSystemChatbotChange = async (value: string) => {
    const preferredChatbotId = value;

    try {
      const updatedSetting = await authService.updateSystemChatbot(preferredChatbotId);
      setSystemChatbotId(updatedSetting.systemChatbotId || null);
      setSystemChatbotObjectId(updatedSetting.chatbotId || null);
      if (preferredChatbotId && updatedSetting.chatbotId) {
        setSelectedChatBotId(preferredChatbotId, updatedSetting.chatbotId);
      }
      toast.success(t("Settings updated"));
    } catch (error) {
      toast.error(t("Failed to update chatbot preference"));
    }
  };

  return (
    <div className="admin-page">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("Settings")}</h1>
          <p className="text-muted-foreground">{t("Manage your app preferences")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("Language")}
            </CardTitle>
            <CardDescription>{t("Choose display language")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(v) => handleLanguageChange(v as AppLanguage)}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder={t("Select Language")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorCog className="h-5 w-5" />
              {t("Appearance")}
            </CardTitle>
            <CardDescription>{t("Choose light, dark, or system theme")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={theme} onValueChange={(v) => handleThemeChange(v as ThemeOption)}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder={t("Toggle theme")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("Light")}</SelectItem>
                <SelectItem value="dark">{t("Dark")}</SelectItem>
                <SelectItem value="system">{t("System")}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {t("System Chatbot")}
            </CardTitle>
            <CardDescription>{t("Select chatbot used for all chat conversations")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedChatBotId || systemChatbotId || chatbots[0]?.botId || ""}
              onValueChange={handleSystemChatbotChange}
              disabled={chatbots.length === 0}
            >
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder={t("Select chatbot for chat")} />
              </SelectTrigger>
              <SelectContent>
                {chatbots.map((bot) => (
                  <SelectItem key={bot._id} value={bot.botId}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {t("More settings coming soon")}
            </CardTitle>
            <CardDescription>{t("Additional preferences will be added here in next updates")}</CardDescription>
          </CardHeader>
        </Card>

        <Card id="user-guide" className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t("General User Guide")}
            </CardTitle>
            <CardDescription>{t("This guide applies to the entire web app.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900/60">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                <LifeBuoy className="h-4 w-4 text-blue-600" />
                {t("Get Help")}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("Need more support? Contact your system administrator or support team.")}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900/60">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                {t("Learn More")}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("Read module-specific instructions from each page's question mark icon.")}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Keyboard className="h-4 w-4 text-violet-600" />
                {t("Keyboard Shortcuts")}
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>{t("Enter sends chat messages")}</li>
                <li>{t("Shift + Enter inserts a new line")}</li>
                <li>{t("Esc closes most dialogs and popovers")}</li>
              </ul>
            </div>

            <Link to="/help" className="inline-block">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                {t("Open Full Guide")}
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}