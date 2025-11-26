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
  const handleRestore = async () => {
    try {
      await onConfirm();
      toast.success("Khôi phục thành công!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Khôi phục thất bại, vui lòng thử lại!");
      console.error("Restore error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-gray-800/50" />
      <DialogContent className="max-w-sm p-6 text-center space-y-4">
        <DialogHeader className="flex flex-col items-center space-y-2">
          <div className="bg-green-100 p-3 rounded-full">
            <RotateCcw className="text-green-600 w-8 h-8" />
          </div>
          <DialogTitle className="text-lg">Khôi phục mục</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Bạn có chắc muốn khôi phục mục này?
            <br />
            <span className="text-green-600 font-medium">Nó sẽ được chuyển về danh sách hoạt động.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleRestore}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Khôi phục
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
