import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmUnbanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const ConfirmUnbanUserDialog: React.FC<ConfirmUnbanUserDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUnban = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Unban failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Unban User</DialogTitle>
          <DialogDescription>
            Are you sure you want to unban this user?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleUnban} disabled={isProcessing}>
            {isProcessing ? "Unbanning..." : "Unban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
