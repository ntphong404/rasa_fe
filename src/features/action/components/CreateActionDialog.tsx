"use client";
import { useState } from "react";
// @ts-ignore
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import { Plus, Code, HelpCircle, AlertTriangle } from "lucide-react";

import { actionService } from "../api/service";
import { usePyodideSyntaxCheck } from "@/hooks/usePyodideSyntaxCheck";
import { PythonCodeEditor } from "@/components/code-editor";

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
  };

  const handleSubmit = async (emptyDefine: boolean = false) => {
    const sanitizedName = toSnakeCase(name);
    if (!sanitizedName) {
      alert(t("Please enter action name"));
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

    try {
      setIsSubmitting(true);
      await actionService.createAction({
        name: sanitizedName,
        description: description.trim(),
        define: finalDefine,
      });

      resetForm();
      onActionCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating action:", error);
      alert(t("Failed to create action"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Plus className="h-6 w-6 text-purple-600" />
            {t("Create New Action")}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium">{t("What is an Action?")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Actions are custom Python code that a bot can run. They are used for tasks like calling APIs, querying a database, or interacting with external systems."
                    )}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Basic Info Card */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("Basic Information")}</h3>
              <div className="space-y-4">
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
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Code Editor Card */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{t("Python Code")}</h3>
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
              <div className="h-[calc(90vh-450px)] min-h-[400px] overflow-auto">
                <PythonCodeEditor
                  value={define}
                  onChange={setDefine}
                  onClearError={() => setSyntaxError(null)}
                  className="h-full border rounded-md bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 py-4 border-t bg-gray-50">
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