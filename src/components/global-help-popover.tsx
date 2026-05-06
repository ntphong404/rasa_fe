import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HelpCircle, BookOpen, Keyboard, LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function GlobalHelpPopover() {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          title={t("Help & Guide")}
          aria-label={t("Help & Guide")}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">{t("Quick Help")}</h4>
            <p className="text-xs text-muted-foreground">{t("Use this quick guide to navigate core features")}</p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <LifeBuoy className="mt-0.5 h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium">{t("Get Help")}</p>
                <p className="text-xs text-muted-foreground">{t("Need more support? Contact your system administrator or support team.")}</p>
                <a className="text-xs font-medium text-blue-600 hover:underline" href="mailto:support@example.com">
                  {t("Contact Support")}
                </a>
              </div>
            </div>

            <div className="flex gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs font-medium">{t("Learn More")}</p>
                <p className="text-xs text-muted-foreground">{t("Read module-specific instructions from each page's question mark icon.")}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Keyboard className="mt-0.5 h-4 w-4 text-violet-600" />
              <div>
                <p className="text-xs font-medium">{t("Keyboard Shortcuts")}</p>
                <p className="text-xs text-muted-foreground">{t("Enter sends chat messages, Shift + Enter inserts a new line, Esc closes most dialogs.")}</p>
              </div>
            </div>
          </div>

          <Link to="/help" className="block">
            <Button className="w-full" size="sm">
              {t("Open Full Guide")}
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
