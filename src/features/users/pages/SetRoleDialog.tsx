import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "../api/dto/User";
import { userService } from "../api/service";
import { rolesService } from "@/features/roles/api/service";

interface Role {
  _id: string;
  name: string;
  description?: string;
}

interface SetRoleDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SetRoleDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: SetRoleDialogProps) {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch roles khi dialog mở
  useEffect(() => {
    if (!open) return;

    const fetchRoles = async () => {
      setIsFetching(true);
      try {
        const response = await rolesService.fetchRoles("");
        if (response?.data) {
          setRoles(response.data);
          // Set current role if user has one
          if (user?.roles?.[0]) {
            setSelectedRole(user.roles[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchRoles();
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user?._id || !selectedRole) return;

    setIsLoading(true);
    try {
      await userService.setRole(user._id, selectedRole);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Error setting role:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Set Role for User")}</DialogTitle>
          <DialogDescription>
            {user?.firstName} {user?.lastName} ({user?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">{t("Role")}</label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isFetching}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select a role")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedRole || isLoading}
          >
            {isLoading ? t("Setting...") : t("Set Role")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
