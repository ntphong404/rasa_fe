import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, Code, Calendar, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IAction } from "@/interfaces/action.interface";

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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-purple-600" />
            {t("Action Details")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-3 py-3 pt-0 overflow-y-auto flex-1">
          <div className="space-y-2">
            {/* Name & Description Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">
                      {t("Name")}
                    </h3>
                    <p className="text-lg font-bold text-purple-900">{action.name}</p>
                  </div>
                  {action.deleted ? (
                    <Badge variant="destructive" className="h-6">{t("Deleted")}</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 h-6">{t("Active")}</Badge>
                  )}
                </div>
                {action.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">
                      {t("Description")}
                    </h3>
                    <p className="text-sm text-gray-700">{action.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Code Definition */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Code className="h-4 w-4 text-purple-600" />
                {t("Python Code")}
              </h3>
              {action.define ? (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap">{action.define}</pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("No code provided")}
                </p>
              )}
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Calendar className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide">
                    {t("Created At")}
                  </h3>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(action.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Calendar className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide">
                    {t("Updated At")}
                  </h3>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(action.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Deleted status */}
            {action.deleted && action.deletedAt && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive" className="text-sm">{t("Deleted")}</Badge>
                  <span className="text-sm text-red-600 font-medium">
                    {t("on")} {new Date(action.deletedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
