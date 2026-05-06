import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";

type ThemeOption = "light" | "dark" | "system";

export function ThemeModeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const themeOptions: Array<{ value: ThemeOption; label: string; icon: typeof Sun }> = [
    { value: "light", label: t("Light"), icon: Sun },
    { value: "dark", label: t("Dark"), icon: Moon },
    { value: "system", label: t("System"), icon: Monitor },
  ];
  const CurrentThemeIcon =
    themeOptions.find((option) => option.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full p-0">
          <CurrentThemeIcon className="h-5 w-5" />
          <span className="sr-only">{t("Appearance")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-0 w-12 p-1">
        <div className="flex flex-col items-center gap-1">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`h-10 w-10 justify-center rounded-full p-0 ${
                isActive ? "bg-accent text-accent-foreground" : ""
              }`}
              title={option.label}
              aria-label={option.label}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{option.label}</span>
            </DropdownMenuItem>
          );
        })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}