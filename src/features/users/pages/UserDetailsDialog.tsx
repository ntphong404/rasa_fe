import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IUser } from "@/interfaces/user.interface";
import defaultAvatar from "@/assets/vietnam-flag.png";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/useRole";
import { useEffect, useState } from "react";
import { User } from "../api/dto/User";
import {
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Loader2,
  Info,
  X,
} from "lucide-react";

export function UserDetailDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { getRoleById } = useRole();
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // Fetch role names khi dialog mở và có user
  useEffect(() => {
    const fetchRoleNames = async () => {
      if (!user?.roles || !open) return;

      setLoadingRoles(true);
      try {
        const names = await Promise.all(
          user.roles.map(async (roleItem) => {
            const role = await getRoleById(roleItem);
            return role?.name || roleItem;
          })
        );
        setRoleNames(names);
      } catch (error) {
        console.error("Failed to fetch role names:", error);
        setRoleNames(user.roles);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoleNames();
  }, [user?.roles, open]);
  
  if (!user) return null;

  const getStatusBadge = () => {
    if (user.status === "ACTIVE") {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Hoạt động
        </Badge>
      );
    } else if (user.status === "BANNED") {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Bị khóa
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 text-xs">
        Pending
      </Badge>
    );
  };

  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case "MALE": return "Nam";
      case "FEMALE": return "Nữ";
      default: return "Khác";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] p-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 border-2 border-blue-100 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-50 rounded-lg p-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Header with gradient background - Compact */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-4 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
          
          <div className="relative flex items-center gap-2">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <Eye className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Thông tin người dùng
            </DialogTitle>
          </div>
          
          <DialogDescription className="text-blue-100 text-xs mt-1 relative flex items-center gap-1 ml-7">
            <Info className="h-3 w-3" />
            Xem chi tiết hồ sơ tài khoản
          </DialogDescription>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-150px)]">
          {/* Avatar and Basic Info Section */}
          <div className="px-5 pt-2">
            <div className="bg-white rounded-xl border-2 border-blue-100 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Avatar with status indicator */}
                <div className="relative flex-shrink-0">
                  <img
                    src={user.avatar || defaultAvatar}
                    alt={user.firstName}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-blue-200 shadow-md"
                  />
                  <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-md ${
                    user.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                </div>

                {/* Name and Status */}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start mb-2">
                    <Mail className="h-3.5 w-3.5 text-gray-500" />
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    {getStatusBadge()}
                    {user.is2FAEnabled && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        2FA
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information Section */}
          <div className="px-5 py-3">
            <div className="grid gap-3">
              {/* Personal Information Card */}
              <div className="bg-white rounded-xl border-2 border-blue-100 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                    <UserIcon className="h-3.5 w-3.5 text-white" />
                  </div>
                  Thông tin cá nhân
                </h4>
                
                <div className="space-y-2">
                  {/* Phone Number */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                      <Phone className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Số điện thoại</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.phoneNumber || "Chưa cập nhật"}</p>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Ngày sinh</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(user.dateOfBirth).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                      <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Giới tính</p>
                      <p className="text-sm font-semibold text-gray-900">{getGenderDisplay(user.gender)}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Địa chỉ</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.address || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Information Card */}
              <div className="bg-white rounded-xl border-2 border-blue-100 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                    <Shield className="h-3.5 w-3.5 text-white" />
                  </div>
                  Vai trò & Quyền hạn
                </h4>
                
                <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="p-1.5 bg-white rounded-md shadow-sm">
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1">Vai trò</p>
                    {loadingRoles ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Đang tải...
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {roleNames.map((roleName, index) => (
                          <Badge 
                            key={index}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-xs"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {roleName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-0 bg-gray-50 border-t-2 border-blue-100">
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
