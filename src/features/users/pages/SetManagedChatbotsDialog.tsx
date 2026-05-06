import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChatbots } from "@/hooks/useChatbots";
import { User } from "../api/dto/User";
import { userService } from "../api/service";
import { rolesService } from "@/features/roles/api/service";

interface SetManagedChatbotsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SetManagedChatbotsDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: SetManagedChatbotsDialogProps) {
  const { t } = useTranslation();
  const { chatbots } = useChatbots();
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setSelectedBotId(user.managedBotIds?.[0] || "");
  }, [open, user]);

  useEffect(() => {
    if (!open) return;

    const fetchRoles = async () => {
      try {
        const response = await rolesService.fetchRoles("");
        const map: Record<string, string> = {};
        (response?.data || []).forEach((role) => {
          map[role._id] = (role.name || "").toUpperCase();
        });
        setRoleMap(map);
      } catch {
        setRoleMap({});
      }
    };

    fetchRoles();
  }, [open]);

  const isManager = useMemo(() => {
    if (!user?.roles?.length) return false;
    return user.roles.some((roleId) => roleMap[roleId] === "MANAGER");
  }, [roleMap, user]);

  const toggleBot = (botId: string) => {
    setSelectedBotId((prev) => (prev === botId ? "" : botId));
  };

  const handleSave = async () => {
    if (!user?._id) return;

    setIsSaving(true);
    try {
      await userService.setManagedChatbots(user._id, selectedBotId ? [selectedBotId] : []);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating managed chatbots:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Assign managed chatbots")}</DialogTitle>
          <DialogDescription>
            {t("Choose one chatbot this manager can access in management modules")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {!isManager && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {t("Selected user is not MANAGER role. Backend may reject update.")}
            </div>
          )}

          {chatbots.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("No chatbot found")}</div>
          ) : (
            chatbots.map((bot) => (
              <label
                key={bot._id}
                className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 hover:bg-muted/40"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium">{bot.name}</div>
                  <div className="text-xs text-muted-foreground">{bot.botId}</div>
                </div>
                <Checkbox
                  checked={selectedBotId === bot.botId}
                  onCheckedChange={() => toggleBot(bot.botId)}
                />
              </label>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedBotId ? <Badge variant="secondary">{selectedBotId}</Badge> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !user?._id}>
            {isSaving ? t("Saving...") : t("Save assignment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
