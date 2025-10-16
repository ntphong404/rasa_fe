import toast from "react-hot-toast";
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
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const handleDelete = async () => {
    try {
      await onConfirm();
      toast.success("Deleted Successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Delete failed, please try again!");
      console.error("Delete error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Updated DialogOverlay to have light gray matted effect */}
      <DialogOverlay className="bg-gray-800/50" />{" "}
      {/* Use gray overlay with 50% opacity */}
      <DialogContent className="max-w-sm p-6 text-center space-y-4">
        <DialogHeader className="flex flex-col items-center space-y-2">
          <AlertTriangle className="text-red-500 w-10 h-10" />
          <DialogTitle className="text-lg">Confirm Deletion</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Are you sure you want to{" "}
            <span className="text-red-500 font-semibold">delete</span> this
            item?
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

// Soft Delete Dialog - Move to trash/archive
export function ConfirmSoftDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const handleSoftDelete = async () => {
    try {
      await onConfirm();
      toast.success("Moved to trash successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to move to trash, please try again!");
      console.error("Soft delete error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-gray-800/50" />
      <DialogContent className="max-w-sm p-6 text-center space-y-4">
        <DialogHeader className="flex flex-col items-center space-y-2">
          <div className="bg-orange-100 p-3 rounded-full">
            <Archive className="text-orange-600 w-8 h-8" />
          </div>
          <DialogTitle className="text-lg">Move to Trash</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Are you sure you want to move this item to trash?
            <br />
            <span className="text-orange-600 font-medium">
              You can restore it later.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleSoftDelete}
          >
            Move to Trash
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
}: ConfirmDeleteDialogProps) {
  const handleHardDelete = async () => {
    try {
      await onConfirm();
      toast.success("Permanently deleted!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Delete failed, please try again!");
      console.error("Hard delete error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-gray-800/50" />
      <DialogContent className="max-w-sm p-6 text-center space-y-4">
        <DialogHeader className="flex flex-col items-center space-y-2">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
          <DialogTitle className="text-lg text-red-600">
            Permanent Deletion
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Are you sure you want to{" "}
            <span className="text-red-600 font-semibold">
              permanently delete
            </span>{" "}
            this item?
            <br />
            <span className="text-red-600 font-bold">
              This action CANNOT be undone!
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-xs text-red-700">
            ⚠️ Warning: All associated data will be permanently removed from the
            database.
          </p>
        </div>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleHardDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
