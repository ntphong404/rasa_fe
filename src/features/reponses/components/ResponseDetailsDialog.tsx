import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { IMyResponse } from "@/interfaces/response.interface";
import { useTranslation } from "react-i18next";
import { Calendar, Code, Users, AlertCircle, Hash, MessageSquare } from "lucide-react";

interface ResponseDetailsDialogProps {
  response: IMyResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ResponseDetailsDialog({
  response,
  open,
  onOpenChange,
}: ResponseDetailsDialogProps) {
  const { t } = useTranslation();

  if (!response) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 dark:border-white/10">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6 text-amber-600" />
            {t("Response Details")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3 pt-0">
          <div className="space-y-2">
            {/* Name & Description Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                      {t("Name")}
                    </h3>
                    <p className="text-lg font-bold text-amber-900">{response.name}</p>
                  </div>
                  {response.deleted ? (
                    <Badge variant="destructive" className="h-6">{t("Deleted")}</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 h-6">{t("Active")}</Badge>
                  )}
                </div>
                {response.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">
                      {t("Description")}
                    </h3>
                    <p className="text-sm text-foreground">{response.description}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">
                    {t("Label")}
                  </h3>
                  {response.label ? (
                    <Badge variant="outline">{response.label}</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>
              </div>
            </div>

            {/* Roles & Response ID */}
            <div className="grid grid-cols-2 gap-4">
              {/* Roles */}
              <div className="surface-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Users className="h-4 w-4 text-green-600" />
                  {t("Roles")}
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {response.roles?.length || 0}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {response.roles && response.roles.length > 0 ? (
                    response.roles.map((role, index) => (
                      <Badge key={index} className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      {t("No roles assigned")}
                    </span>
                  )}
                </div>
              </div>

              {/* Response ID */}
              {response._id && (
                <div className="surface-card p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                    <Hash className="h-4 w-4 text-slate-600" />
                    {t("Response ID")}
                  </h3>
                  <p className="text-xs font-mono bg-slate-100 p-2 rounded text-slate-700 break-all">
                    {response._id}
                  </p>
                </div>
              )}
            </div>


            {/* YAML Definition */}
            <div className="surface-card p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <Code className="h-4 w-4 text-amber-600" />
                {t("YAML Definition")}
              </h3>
              {response.define ? (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                  <pre className="whitespace-pre-wrap">{response.define}</pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("No YAML definition provided")}
                </p>
              )}
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 border dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                  <Calendar className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide">
                    {t("Created At")}
                  </h3>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {new Date(response.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 border dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                  <Calendar className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide">
                    {t("Updated At")}
                  </h3>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {new Date(response.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Deleted status */}
            {response.deleted && response.deletedAt && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive" className="text-sm">{t("Deleted")}</Badge>
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {t("on")} {new Date(response.deletedAt).toLocaleString()}
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