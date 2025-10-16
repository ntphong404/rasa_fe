"use client";

import { useTranslation } from "react-i18next";
import type { Role } from "../api/dto/RoleResponse";
import { useEffect, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
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
import type { Permission } from "@/features/permissions/api/dto/permissions.dto";
import {
  ShieldCheck,
  Calendar,
  FileText,
  Tag,
  AlertCircle,
} from "lucide-react";

// RoleDetailsDialog
interface RoleDetailsDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RoleDetailsDialog({
  role,
  open,
  onOpenChange,
}: RoleDetailsDialogProps) {
  const { t } = useTranslation();
  const { fetchPermissions } = usePermission();
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);

      const fetchData = async () => {
        try {
          const permissionQuery = new URLSearchParams({
            page: "1",
            limit: "100",
          }).toString();
          const permissionResponse = await fetchPermissions(
            `?${permissionQuery}`
          );
          setPermissionsList(permissionResponse.data);

          const chatbotQuery = new URLSearchParams({
            page: "1",
            limit: "100",
          }).toString();
          // const chatbotResponse = await fetchChatBots(`?${chatbotQuery}`);
          // setChatbotsList(chatbotResponse.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            {t("Role Details")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("View comprehensive information about this role")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : role ? (
          <div className="space-y-6 py-2">
            {/* Name Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                {t("Name")}
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-lg font-semibold">{role.name}</p>
              </div>
            </div>

            <Separator />

            {/* Description Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                {t("Description")}
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm leading-relaxed">
                  {role.description || (
                    <span className="italic text-muted-foreground">
                      {t("No description")}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Separator />

            {/* Permissions Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                {t("Permissions")}
                <Badge variant="secondary" className="ml-auto">
                  {role.permissions.length}
                </Badge>
              </div>
              {role.permissions.length > 0 ? (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((permId) => {
                      const permission = permissionsList.find(
                        (p) => p._id === permId
                      );
                      return (
                        <Badge
                          key={permId}
                          variant="outline"
                          className="px-3 py-1.5 text-xs font-medium"
                        >
                          {permission?.originalUrl || permId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("No permissions")}
                  </p>
                </div>
              )}
            </div>

            {/* Uncomment when chatbots are ready */}
            {/* <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Bot className="h-4 w-4" />
                {t("Chatbots")}
                <Badge variant="secondary" className="ml-auto">
                  {role.chatbots.length}
                </Badge>
              </div>
              {role.chatbots.length > 0 ? (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex flex-wrap gap-2">
                    {role.chatbots.map((chatbotId) => {
                      const chatbot = chatbotsList.find(
                        (c) => c._id === chatbotId
                      );
                      return (
                        <Badge
                          key={chatbotId}
                          variant="outline"
                          className="px-3 py-1.5 text-xs font-medium"
                        >
                          {chatbot?.name || chatbotId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("No chatbots")}
                  </p>
                </div>
              )}
            </div> */}

            <Separator />

            {/* Timestamps Section */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {t("Created At")}
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-sm">{formatDate(role.createdAt)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {t("Updated At")}
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-sm">{formatDate(role.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("No role selected")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
