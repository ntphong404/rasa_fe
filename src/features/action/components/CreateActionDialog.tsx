"use client";
import { useState, useEffect, useMemo } from "react";
// import "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { Plus, Code, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { actionService } from "../api/service";
import { usePyodideSyntaxCheck } from "@/hooks/usePyodideSyntaxCheck";
import { PythonCodeEditor } from "@/components/code-editor";
import { ModuleHelpPopover } from "@/components/module-help-popover";
import { useChatbotStore } from "@/store/chatbot";
import { useChatbots } from "@/hooks/useChatbots";
import { useAuthStore } from "@/store/auth";

// export interface CreateActionRequest {
//   name: string;
//   description: string;
//   define: string;
// }

interface CreateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionCreated: () => void;
}

export default function CreateActionDialog({
  open,
  onOpenChange,
  onActionCreated,
}: CreateActionDialogProps) {
  const { t } = useTranslation();

  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const user = useAuthStore((state) => state.user);
  const { chatbots } = useChatbots();
  const isManager = useMemo(
    () => Boolean(user?.roles?.some((role) => role.name?.toUpperCase() === "MANAGER")),
    [user?.roles]
  );
  const managerAssignedBotId = useMemo(() => user?.managedBotIds?.[0] || null, [user?.managedBotIds]);
  const [applicableBotIds, setApplicableBotIds] = useState<string[]>([]);

  useEffect(() => {
    if (isManager) {
      setApplicableBotIds(managerAssignedBotId ? [managerAssignedBotId] : []);
      return;
    }
    if (!selectedBotId || selectedBotId === "global") return;
    setApplicableBotIds((prev) =>
      prev.includes(selectedBotId) ? prev : [...prev, selectedBotId]
    );
  }, [isManager, managerAssignedBotId, selectedBotId]);

  const handleToggleApplicableBot = (botId: string) => {
    setApplicableBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    );
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [define, setDefine] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { syntaxError, setSyntaxError, isPyodideLoading, checkPythonSyntax } = usePyodideSyntaxCheck(define, open);

  // --- Helpers ---
  const toSnakeCase = (str: string): string =>
    str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_");

  const toPascalCase = (str: string): string =>
    (" " + str)
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());

  // --- Generate template Python ---
  const generateTemplate = () => {
    const actionName = name || "my_action";
    const className = `Action${toPascalCase(actionName)}`;

    const template = `from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

class ${className}(Action):

    def name(self) -> Text:
        return "${toSnakeCase(actionName)}"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        dispatcher.utter_message(text="Hello from action: ${toSnakeCase(actionName)}")
        return []
`;

    setDefine(template);
  };

  // --- Reset ---
  const resetForm = () => {
    setName("");
    setDescription("");
    setDefine("");
    setSyntaxError(null);
    setApplicableBotIds([]);
  };

  const handleSubmit = async (emptyDefine: boolean = false) => {
    const sanitizedName = toSnakeCase(name);
    if (!sanitizedName) {
      toast.error(t("Please enter action name"));
      return;
    }

    const finalDefine = emptyDefine ? "" : define;

    if (!emptyDefine && finalDefine.trim()) {
      const syntaxErr = await checkPythonSyntax(finalDefine);
      if (syntaxErr) {
        setSyntaxError(syntaxErr);
        return;
      }
    }

    const targetBotIds = isManager
      ? managerAssignedBotId ? [managerAssignedBotId] : []
      : selectedBotId && selectedBotId !== "global"
        ? [selectedBotId]
        : applicableBotIds;

    try {
      setIsSubmitting(true);
      await actionService.createAction({
        name: sanitizedName,
        description: description.trim(),
        define: finalDefine,
        botId: targetBotIds[0],
      });

      resetForm();
      onActionCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating action:", error);
      toast.error(t("Failed to create action"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog-content !max-w-none w-[95vw] md:w-[92vw] h-[88vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50 dark:border-white/10 dark:from-slate-950 dark:to-slate-900">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Plus className="h-6 w-6 text-purple-600" />
            {t("Create New Action")}
            <ModuleHelpPopover
              title={t("What is an Action?")}
              description={t("Actions are custom Python code that a bot can run. They are used for tasks like calling APIs, querying a database, or interacting with external systems.")}
              iconClassName="text-purple-600"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="surface-card p-4 lg:col-span-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t("Basic Information")}</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="action-name">{t("Action Name")} *</Label>
                  <Input
                    id="action-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={(e) => setName(toSnakeCase(e.target.value))}
                    placeholder={t("e.g., action_hello_world")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="action-desc">{t("Description")}</Label>
                  <Textarea
                    id="action-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("Describe what this action does")}
                    rows={5}
                    className="max-h-[22rem] min-h-[96px]"
                  />
                </div>

                {!isManager && chatbots.length > 0 && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="space-y-1">
                      <Label>{t("Applicable Chatbots")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("Select one or more chatbots this action belongs to")}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {chatbots.filter((bot) => bot.botId !== "global").map((bot) => (
                        <label
                          key={bot._id}
                          className="flex items-center gap-2 rounded-md border p-2 text-sm"
                        >
                          <Checkbox
                            checked={applicableBotIds.includes(bot.botId)}
                            onCheckedChange={() => handleToggleApplicableBot(bot.botId)}
                          />
                          <span>{bot.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card p-4 lg:col-span-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{t("Python Code")}</h3>
                <Button type="button" variant="outline" size="sm" onClick={generateTemplate}>
                  <Code className="h-4 w-4 mr-2" />
                  {t("Generate Template")}
                </Button>
              </div>
              {syntaxError && (
                <div className="flex items-start gap-3 text-sm border border-red-300 rounded-lg p-3 bg-red-50 shadow-sm mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-[1px] flex-shrink-0" />
                  <div className="text-red-700 leading-relaxed whitespace-pre-wrap">
                    <strong className="block mb-1">{t("Python Syntax Error")}</strong>
                    <span className="font-mono text-[13px]">{syntaxError}</span>
                  </div>
                </div>
              )}
              <div className="app-code-panel flex-1 min-h-[240px] md:min-h-[320px] overflow-hidden">
                <PythonCodeEditor
                  value={define}
                  onChange={setDefine}
                  onClearError={() => setSyntaxError(null)}
                  className="h-full rounded-md border border-slate-200 bg-white dark:border-white/15 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 py-4 border-t bg-gray-50 dark:border-white/10 dark:bg-slate-900">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            {t("Empty Define")}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !name || isPyodideLoading || !!syntaxError}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting
              ? t("Creating...")
              : isPyodideLoading
              ? t("Loading Python...")
              : t("Create Action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}