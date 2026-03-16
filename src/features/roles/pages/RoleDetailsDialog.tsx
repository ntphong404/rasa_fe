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
      <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <div className="border-b bg-gradient-to-r from-indigo-50 to-purple-50 px-3 pt-4 dark:border-white/10 dark:from-slate-900 dark:to-slate-800">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-indigo-900 dark:text-indigo-200">
              <div className="p-2 bg-white rounded-lg shadow-sm dark:bg-slate-800">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
              </div>
              Chi tiết vai trò
            </DialogTitle>
            <DialogDescription className="text-sm text-indigo-600 dark:text-indigo-300">
              Xem thông tin chi tiết về vai trò này
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="overflow-y-auto px-3 py-3 pt-0" style={{ maxHeight: 'calc(90vh - 120px)' }}>

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
            <div className="space-y-2">
              {/* Name Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Tag className="h-4 w-4 text-indigo-600" />
                  Tên vai trò
                </div>
                <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 px-3 py-2 shadow-sm dark:border-indigo-800/40 dark:from-slate-900 dark:to-slate-900">
                  <p className="text-lg font-bold text-indigo-900 dark:text-indigo-200">{role.name}</p>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Description Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Mô tả
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 dark:border-white/15 dark:bg-slate-900">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {role.description || (
                      <span className="italic text-slate-400 dark:text-slate-500">
                        Không có mô tả
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Permissions Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Quyền hạn
                  <Badge variant="secondary" className="ml-auto bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                    {role.permissions.length}
                  </Badge>
                </div>
                {role.permissions.length > 0 ? (
                  <div className="rounded-lg border-2 border-indigo-100 bg-white p-3 shadow-sm dark:border-indigo-700/40 dark:bg-slate-900">
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permId) => {
                        const permission = permissionsList.find(
                          (p) => p._id === permId
                        );
                        return (
                          <Badge
                            key={permId}
                            variant="outline"
                            className="px-3 py-1.5 text-xs font-medium border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
                          >
                            {permission?.originalUrl || permId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center dark:border-white/15 dark:bg-slate-900">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Không có quyền hạn
                    </p>
                  </div>
                )}
              </div>

              {/* Uncomment when chatbots are ready */}
              {/* <Separator className="bg-slate-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Bot className="h-4 w-4 text-indigo-600" />
                  {t("Chatbots")}
                  <Badge variant="secondary" className="ml-auto bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                    {role.chatbots.length}
                  </Badge>
                </div>
                {role.chatbots.length > 0 ? (
                  <div className="rounded-lg border-2 border-indigo-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      {role.chatbots.map((chatbotId) => {
                        const chatbot = chatbotsList.find(
                          (c) => c._id === chatbotId
                        );
                        return (
                          <Badge
                            key={chatbotId}
                            variant="outline"
                            className="px-3 py-1.5 text-xs font-medium border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            {chatbot?.name || chatbotId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">
                      {t("No chatbots")}
                    </p>
                  </div>
                )}
              </div> */}

              <Separator className="bg-slate-200" />

              {/* Timestamps Section */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Ngày tạo
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 shadow-sm dark:border-green-700/40 dark:bg-green-950/25">
                    <p className="text-sm font-medium text-green-900 dark:text-green-200">{formatDate(role.createdAt)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Ngày cập nhật
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 shadow-sm dark:border-blue-700/40 dark:bg-blue-950/25">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{formatDate(role.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-slate-100 rounded-full mb-4 dark:bg-slate-800">
                <AlertCircle className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-base font-medium text-slate-600 dark:text-slate-300">
                Chưa chọn vai trò
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
