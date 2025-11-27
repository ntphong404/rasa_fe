"use client";

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
      <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b px-3 pt-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-indigo-900">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
              </div>
              Chi tiết quyền hạn
            </DialogTitle>
            <DialogDescription className="text-sm text-indigo-600">
              Xem thông tin chi tiết về quyền hạn này
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="overflow-y-auto px-3 py-3 pt-0" style={{ maxHeight: 'calc(90vh - 120px)' }}>

          {isLoading ? (
            <div className="space-y-5 py-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-32" />
            </div>
          ) : permission ? (
            <div className="space-y-2">
              {/* Endpoint */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Tag className="h-4 w-4 text-indigo-600" />
                  Đường dẫn API
                </div>
                <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 px-3 py-2 shadow-sm">
                  <p className="text-sm font-mono break-all font-semibold text-indigo-900">
                    {permission.originalUrl}
                  </p>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Method */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Phương thức
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
                    className="ml-auto text-sm font-bold"
                  >
                    {permission.method}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Mô tả
                </div>
                <div className="rounded-lg bg-slate-50 border-2 border-slate-200 px-3 py-2 shadow-sm">
                  <p className="text-sm leading-relaxed text-slate-700">
                    {permission.description || (
                      <span className="italic text-slate-400">
                        Không có mô tả
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Module */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Puzzle className="h-4 w-4 text-orange-600" />
                  Phân hệ
                </div>
                <div className="rounded-lg bg-orange-50 border-2 border-orange-200 px-3 py-2 shadow-sm">
                  <p className="text-sm font-bold text-orange-900">{permission.module}</p>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Public / Private */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Globe className="h-4 w-4 text-blue-600" />
                  Quyền truy cập
                </div>
                <div className={`rounded-lg px-3 py-2 flex items-center gap-2 border-2 shadow-sm ${permission.isPublic ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {permission.isPublic ? (
                    <>
                      <Unlock className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-bold text-green-700">
                        Công khai
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-bold text-red-700">
                        Riêng tư
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Separator className="bg-slate-200" />

              {/* Timestamps */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Ngày tạo
                  </div>
                  <div className="rounded-lg bg-green-50 border-2 border-green-200 px-3 py-2 shadow-sm">
                    <p className="text-sm font-semibold text-green-900">{formatDate(permission.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Ngày cập nhật
                  </div>
                  <div className="rounded-lg bg-blue-50 border-2 border-blue-200 px-3 py-2 shadow-sm">
                    <p className="text-sm font-semibold text-blue-900">{formatDate(permission.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <AlertCircle className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-base font-medium text-slate-600">
                Chưa chọn quyền hạn
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
