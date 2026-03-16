import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "./ui/dialog";
import { RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface ConfirmRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
// Restore Dialog - Restore deleted item
export function ConfirmRestoreDialog({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmRestoreDialogProps) {
  const { t } = useTranslation();

  const handleRestore = async () => {
    try {
      await onConfirm();
      toast.success(t("Restored successfully"));
      onOpenChange(false);
    } catch (error) {
      toast.error(t("Restore failed. Please try again."));
      console.error("Restore error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/45 backdrop-blur-[1px]" />
      <DialogContent className="max-w-sm p-6 text-center space-y-4">
        <DialogHeader className="flex flex-col items-center space-y-2">
          <div className="bg-green-100 p-3 rounded-full">
            <RotateCcw className="text-green-600 w-8 h-8" />
          </div>
          <DialogTitle className="text-lg">{t("Restore item")}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {t("Are you sure you want to restore this item?")}
            <br />
            <span className="text-green-600 font-medium">{t("It will be moved back to active list.")}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleRestore}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("Restore")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
