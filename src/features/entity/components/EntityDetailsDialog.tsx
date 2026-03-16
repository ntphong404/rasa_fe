import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IEntity } from "@/interfaces/entity.interface";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Calendar, Hash, Clock, Tag, Code, AlertCircle } from "lucide-react";

interface EntityDetailsDialogProps {
  entity: IEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EntityDetailsDialog({
  entity,
  open,
  onOpenChange,
}: EntityDetailsDialogProps) {
  const { t } = useTranslation();

  if (!entity) return null;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 dark:border-white/10">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Tag className="h-6 w-6 text-emerald-600" />
            {t("Entity Details")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3 pt-0">
          <div className="space-y-2">
            {/* Name & Description Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                      {t("Name")}
                    </h3>
                    <p className="text-lg font-bold text-emerald-900">{entity.name}</p>
                  </div>
                  <Badge variant={entity.deleted ? "destructive" : "default"} className="h-6">
                    {entity.deleted ? t("Deleted") : t("Active")}
                  </Badge>
                </div>
                {entity.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">
                      {t("Description")}
                    </h3>
                    <p className="text-sm text-foreground">{entity.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* YAML Definition */}
            <div className="surface-card p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <Code className="h-4 w-4 text-emerald-600" />
                {t("YAML Definition")}
              </h3>
              {entity.define ? (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                  <pre className="whitespace-pre-wrap">
                    {entity.define}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("No definition provided")}
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
                  {formatDate(entity.createdAt)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 border dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                  <Clock className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide">
                    {t("Updated At")}
                  </h3>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {entity.updatedAt
                    ? formatDate(entity.updatedAt)
                    : t("Not updated")}
                </p>
              </div>
            </div>

            {/* Entity ID */}
            {entity._id && (
              <div className="surface-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Hash className="h-4 w-4 text-slate-600" />
                  {t("Entity ID")}
                </h3>
                <p className="text-xs font-mono bg-slate-100 p-2 rounded text-slate-700">
                  {entity._id}
                </p>
              </div>
            )}

            {/* Deleted status */}
            {entity.deleted && entity.deletedAt && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive" className="text-sm">{t("Deleted")}</Badge>
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {t("on")} {formatDate(entity.deletedAt)}
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