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
import { Shield, User as UserIcon, Mail, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const currentRole = roles.find((r) => r._id === user?.roles?.[0]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 border-2 border-blue-100 shadow-2xl">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          
          <div className="relative flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              {t("Set Role for User")}
            </DialogTitle>
          </div>
          
          <DialogDescription className="text-blue-100 text-sm mt-2 relative">
            {t("Assign a role to manage user permissions")}
          </DialogDescription>
        </div>

        {/* User Info Card */}
        <div className="px-6 pt-6">
          <div className="bg-white rounded-xl border-2 border-blue-100 p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  {currentRole && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-xs">
                      {currentRole.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <label className="text-sm font-semibold text-gray-900">
                {t("Select New Role")}
              </label>
            </div>
            
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isFetching}
            >
              <SelectTrigger className="h-12 border-2 border-blue-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-white hover:bg-blue-50">
                <SelectValue placeholder={
                  isFetching ? (
                    <span className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("Loading roles...")}
                    </span>
                  ) : (
                    t("Select a role")
                  )
                } />
              </SelectTrigger>
              <SelectContent className="border-2 border-blue-100">
                {roles.map((role) => (
                  <SelectItem 
                    key={role._id} 
                    value={role._id}
                    className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="font-medium">{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-gray-500">{role.description}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRole && selectedRole !== user?.roles?.[0] && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  {t("This will update the user's permissions immediately")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-2 hover:bg-gray-100 transition-all duration-200"
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedRole || isLoading || selectedRole === user?.roles?.[0]}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Setting...")}
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {t("Set Role")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
