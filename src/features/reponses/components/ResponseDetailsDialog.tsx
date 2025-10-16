import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IMyResponse } from "@/interfaces/response.interface";
import { useTranslation } from "react-i18next";
import { Calendar, User, FileText, Code2, Shield } from "lucide-react";

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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {response.name}
          </DialogTitle>
          <DialogDescription>
            {t("Response details and configuration")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              <span>{t("Basic Information")}</span>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("Name")}
                </label>
                <p className="mt-1 text-sm font-medium">{response.name}</p>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("Description")}
                </label>
                <p className="mt-1 text-sm">
                  {response.description || (
                    <span className="text-muted-foreground italic">
                      {t("No description provided")}
                    </span>
                  )}
                </p>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("Status")}
                </label>
                <div className="mt-1">
                  {response.deleted ? (
                    <Badge variant="destructive">{t("Deleted")}</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600">
                      {t("Active")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Roles Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              <span>{t("Roles & Permissions")}</span>
            </div>
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium text-muted-foreground">
                {t("Assigned Roles")}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {response.roles && response.roles.length > 0 ? (
                  response.roles.map((role, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm"
                    >
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
          </div>

          {/* YAML Definition */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Code2 className="h-4 w-4" />
              <span>{t("YAML Definition")}</span>
            </div>
            <div className="rounded-lg border">
              {response.define ? (
                <div className="max-h-[250px] overflow-y-auto">
                  <pre className="p-4 text-xs bg-muted/50 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                    <code>{response.define}</code>
                  </pre>
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground italic">
                  {t("No YAML definition provided")}
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              <span>{t("Metadata")}</span>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {t("Created At")}
                  </label>
                  <p className="mt-1 text-sm">
                    {new Date(response.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {t("Updated At")}
                  </label>
                  <p className="mt-1 text-sm">
                    {new Date(response.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {response.deleted && response.deletedAt && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {t("Deleted At")}
                    </label>
                    <p className="mt-1 text-sm text-red-600">
                      {new Date(response.deletedAt).toLocaleString()}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {t("ID")}
                </label>
                <p className="mt-1 text-xs font-mono text-muted-foreground break-all">
                  {response._id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}