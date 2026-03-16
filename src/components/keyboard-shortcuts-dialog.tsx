import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

export function KeyboardShortcutsDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();
      const openByCtrlSlash = e.ctrlKey && key === "/";
      const openByQuestionMark = e.shiftKey && key === "?";

      if (openByCtrlSlash || openByQuestionMark) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-violet-600" />
            {t("Keyboard Shortcuts")}
          </DialogTitle>
          <DialogDescription>{t("Speed up common actions")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60">
            <span>{t("Open shortcuts help")}</span>
            <kbd className="rounded bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">Ctrl + /</kbd>
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60">
            <span>{t("Enter sends chat messages")}</span>
            <kbd className="rounded bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">Enter</kbd>
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60">
            <span>{t("Shift + Enter inserts a new line")}</span>
            <kbd className="rounded bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">Shift + Enter</kbd>
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60">
            <span>{t("Esc closes most dialogs and popovers")}</span>
            <kbd className="rounded bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">Esc</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
