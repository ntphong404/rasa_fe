"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Permission } from "../api/dto/permissions.dto";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  FileText,
  Tag,
  Globe,
  AlertCircle,
  Calendar,
  Lock,
  Unlock,
  Puzzle,
} from "lucide-react";

// PermissionDetailsDialog
interface PermissionDetailsDialogProps {
  permission: Permission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PermissionDetailsDialog({
  permission,
  open,
  onOpenChange,
}: PermissionDetailsDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // giả lập hiệu ứng loading khi mở dialog
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            {t("Permission Details")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("View full details for this permission")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-5 py-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-32" />
          </div>
        ) : permission ? (
          <div className="space-y-6 py-2">
            {/* Endpoint */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                {t("Endpoint")}
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm font-mono break-all">
                  {permission.originalUrl}
                </p>
              </div>
            </div>

            <Separator />

            {/* Method */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                {t("Method")}
                <Badge
                  variant={
                    permission.method === "GET"
                      ? "outline"
                      : permission.method === "POST"
                      ? "secondary"
                      : permission.method === "PUT"
                      ? "default"
                      : "destructive"
                  }
                  className="ml-auto"
                >
                  {permission.method}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                {t("Description")}
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm leading-relaxed">
                  {permission.description || (
                    <span className="italic text-muted-foreground">
                      {t("No description")}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Separator />

            {/* Module */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Puzzle className="h-4 w-4" />
                {t("Module")}
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-2">
                <p className="text-sm font-medium">{permission.module}</p>
              </div>
            </div>

            <Separator />

            {/* Public / Private */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Globe className="h-4 w-4" />
                {t("Access")}
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-2 flex items-center gap-2">
                {permission.isPublic ? (
                  <>
                    <Unlock className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      {t("Public")}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      {t("Private")}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {t("Created At")}
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-sm">{formatDate(permission.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {t("Updated At")}
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-sm">{formatDate(permission.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("No permission selected")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
