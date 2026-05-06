import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Code, Calendar, AlertCircle, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IAction } from "@/interfaces/action.interface";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ModuleHelpPopover } from "@/components/module-help-popover";
import { PythonCodeEditor } from "@/components/code-editor";

interface ActionDetailsDialogProps {
  action: IAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ActionDetailsDialog({ action, open, onOpenChange }: ActionDetailsDialogProps) {
  const { t } = useTranslation();

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog-content !max-w-none w-[95vw] md:w-[92vw] h-[88vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 dark:border-white/10">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Eye className="h-6 w-6 text-blue-600" />
            {t("Action Details")}
            <ModuleHelpPopover
              title={t("What is an Action?")}
              description={t("Actions are custom Python code that a bot can run. They are used for tasks like calling APIs, querying a database, or interacting with external systems.")}
              iconClassName="text-blue-600"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-5 py-3">
          <div className="grid h-full gap-3 lg:grid-cols-12">
            <div className="surface-card p-3 lg:col-span-3">
              <h3 className="mb-2 text-sm font-semibold text-foreground">{t("Basic Information")}</h3>
              <div className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="action-name-view">{t("Action Name")}</Label>
                  <Input
                    id="action-name-view"
                    value={action.name || ""}
                    disabled
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="action-desc-view">{t("Description")}</Label>
                  <Textarea
                    id="action-desc-view"
                    value={action.description || ""}
                    rows={6}
                    className="max-h-56 min-h-[112px]"
                    disabled
                    readOnly
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60">
                  <span className="text-sm text-muted-foreground">{t("Status")}</span>
                  {action.deleted ? (
                    <Badge variant="destructive" className="h-6">{t("Deleted")}</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 h-6">{t("Active")}</Badge>
                  )}
                </div>

                <div className="surface-card p-3 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <h3 className="text-xs font-semibold uppercase tracking-wide">
                        {t("Created At")}
                      </h3>
                    </div>
                    <p className="text-sm text-foreground">
                      {new Date(action.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <h3 className="text-xs font-semibold uppercase tracking-wide">
                        {t("Updated At")}
                      </h3>
                    </div>
                    <p className="text-sm text-foreground">
                      {new Date(action.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {action.deleted && action.deletedAt && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/50 dark:bg-red-950/30">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <Badge variant="destructive" className="text-xs">{t("Deleted")}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                      {t("on")} {new Date(action.deletedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card p-3 lg:col-span-9 flex min-h-0 flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">{t("Python Code")}</h3>
              </div>
              <div className="app-code-panel flex-1 min-h-[240px] md:min-h-[320px] overflow-hidden">
                <PythonCodeEditor
                  value={action.define || ""}
                  onChange={() => {}}
                  readOnly
                  className="h-full rounded-md border border-slate-200 bg-white dark:border-white/15 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 px-5 py-3 border-t bg-gray-50 dark:border-white/10 dark:bg-slate-900">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("Close")}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
