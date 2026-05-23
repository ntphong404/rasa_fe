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
import { AlertTriangle, Archive, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  successMessage,
  errorMessage,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  const handleDelete = async () => {
    try {
      await onConfirm();
      toast.success(successMessage || t("Deleted successfully"));
      onOpenChange(false);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      toast.error(serverMessage || errorMessage || t("Delete failed. Please try again."));
      console.error("Delete error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/45 backdrop-blur-[1px]" />
      <DialogContent className="max-w-sm p-6 text-center space-y-4">
        <DialogHeader className="flex flex-col items-center space-y-2">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <DialogTitle className="text-lg">{title || t("Confirm delete")}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {description || t("Are you sure you want to delete this item? This action cannot be undone.")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel || t("Cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            {confirmLabel || t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Soft Delete Dialog - Move to trash/archive
export function ConfirmSoftDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  const handleSoftDelete = async () => {
    try {
      await onConfirm();
      toast.success(t("Moved to trash successfully"));
      onOpenChange(false);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      toast.error(serverMessage || t("Move to trash failed. Please try again."));
      console.error("Soft delete error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/45 backdrop-blur-[1px]" />
      <DialogContent className="max-w-sm p-6 text-center space-y-4">
        <DialogHeader className="flex flex-col items-center space-y-2">
          <div className="bg-orange-100 p-3 rounded-full">
            <Archive className="text-orange-600 w-8 h-8" />
          </div>
          <DialogTitle className="text-lg">{title || t("Move to trash")}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {description || t("Are you sure you want to move this item to trash?")}
            {!description ? (
              <>
                <br />
                <span className="text-orange-600 font-medium">{t("You can restore it later.")}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleSoftDelete}
          >
            {t("Move to trash")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hard Delete Dialog - Permanent deletion
export function ConfirmHardDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  const handleHardDelete = async () => {
    try {
      await onConfirm();
      toast.success(t("Deleted permanently"));
      onOpenChange(false);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      toast.error(serverMessage || t("Delete failed. Please try again."));
      console.error("Hard delete error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/45 backdrop-blur-[1px]" />
      <DialogContent className="max-w-sm p-6 text-center space-y-4">
        <DialogHeader className="flex flex-col items-center space-y-2">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
          <DialogTitle className="text-lg text-red-600">{title || t("Delete permanently")}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {description || t("Are you sure you want to permanently delete this item?")}
            {!description ? (
              <>
                <br />
                <span className="text-red-600 font-bold">{t("This action cannot be undone!")}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-xs text-red-700">
            {t("Warning: All associated data will be permanently removed from the database.")}
          </p>
        </div>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleHardDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("Delete permanently")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
