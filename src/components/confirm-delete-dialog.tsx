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
      toast.success("Xóa thành công!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Xóa thất bại, vui lòng thử lại!");
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
          <DialogTitle className="text-lg">Xác nhận xóa</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Bạn có chắc muốn <span className="text-red-500 font-semibold">xóa</span> mục này không?
            <br />
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Xác nhận
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
      toast.success("Đã chuyển vào thùng rác!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Di chuyển vào thùng rác thất bại, vui lòng thử lại!");
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
          <DialogTitle className="text-lg">Chuyển vào Thùng rác</DialogTitle>
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
            Hủy
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleSoftDelete}
          >
            Chuyển vào Thùng rác
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
      toast.success("Đã xóa vĩnh viễn!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Xóa thất bại, vui lòng thử lại!");
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
          <DialogTitle className="text-lg text-red-600">Xóa vĩnh viễn</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Bạn có chắc muốn <span className="text-red-600 font-semibold">xóa vĩnh viễn</span> mục này?
            <br />
            <span className="text-red-600 font-bold">Hành động này KHÔNG thể hoàn tác!</span>
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
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleHardDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa vĩnh viễn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
