import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IEntity } from "@/interfaces/entity.interface";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { Calendar, FileText, Hash, Clock } from "lucide-react";

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {entity.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={entity.deleted ? "destructive" : "default"}>
              {entity.deleted ? t("Deleted") : t("Active")}
            </Badge>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("Description")}
            </h3>
            <p className="text-sm">
              {entity.description || (
                <span className="text-muted-foreground italic">
                  {t("No description provided")}
                </span>
              )}
            </p>
          </div>

          <Separator />

          {/* YAML Definition */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              {t("YAML Definition")}
            </h3>
            {entity.define ? (
              <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {entity.define}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("No definition provided")}
              </p>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("Created At")}
              </h3>
              <p className="text-sm">{formatDate(entity.createdAt)}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("Updated At")}
              </h3>
              <p className="text-sm">
                {entity.updatedAt
                  ? formatDate(entity.updatedAt)
                  : t("Not updated")}
              </p>
            </div>

            {entity._id && (
              <div className="space-y-2 md:col-span-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {t("Entity ID")}
                </h3>
                <p className="text-xs font-mono bg-muted p-2 rounded">
                  {entity._id}
                </p>
              </div>
            )}

            {entity.deleted && entity.deletedAt && (
              <div className="space-y-2 md:col-span-2">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("Deleted At")}
                </h3>
                <p className="text-sm text-destructive">
                  {formatDate(entity.deletedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}