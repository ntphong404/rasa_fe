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
import { useRole } from "@/hooks/useRole";
import { useEffect, useState } from "react";
import { User } from "../api/dto/User";

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
            console.log("roleId:", roleItem);
            console.log("check user roles:", roleItem);

            const role = await getRoleById(roleItem);
            console.log("check role:", role);

            return role?.name || roleItem;
          })
        );
        console.log("check names:", names);

        // hiện tại names đang là 1 mảng id của role

        setRoleNames(names);
      } catch (error) {
        console.error("Failed to fetch role names:", error);
        setRoleNames(user.roles); // Fallback to IDs
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoleNames();
  }, [user?.roles, open]);
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Thông tin người dùng</DialogTitle>
          <DialogDescription>Xem chi tiết hồ sơ tài khoản</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row items-start gap-6 mt-4">
          {/* Avatar nằm góc trái */}
          <div className="flex-shrink-0">
            <img
              src={user.avatar || defaultAvatar}
              alt={user.firstName}
              className="w-28 h-28 rounded-full object-cover border shadow"
            />
          </div>

          {/* Thông tin người dùng */}
          <div className="grid gap-4 w-full">
            {/* Họ tên */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Họ tên</Label>
              <Input value={user.firstName} disabled className="col-span-3" />
            </div>

            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <Input value={user.email} disabled className="col-span-3" />
            </div>

            {/* Các trường còn lại */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">SĐT</Label>
              <Input value={user.phoneNumber} disabled className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Ngày sinh</Label>
              <Input
                value={new Date(user.dateOfBirth).toLocaleDateString("vi-VN")}
                disabled
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Giới tính</Label>
              <Input
                value={user.gender === "MALE" ? "Nam" : "Nữ"}
                disabled
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Địa chỉ</Label>
              <Input value={user.address} disabled className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Vai trò</Label>
              <Input
                value={loadingRoles ? "Đang tải..." : roleNames.join(", ")}
                disabled
                className="col-span-3"
              />
            </div>

            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Trạng thái</Label>
              <Input
                value={user.deleted ? "Đã bị khóa" : "Đang hoạt động"}
                disabled
                className="col-span-3"
              />
            </div> */}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Xác thực</Label>
              <Input
                value={user.is2FAEnabled ? "Đã xác thực" : "Chưa xác thực"}
                disabled
                className="col-span-3"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
