import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmBanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const ConfirmBanUserDialog: React.FC<ConfirmBanUserDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBan = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Ban failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Ban User</DialogTitle>
          <DialogDescription>
            Are you sure you want to ban this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleBan} disabled={isProcessing}>
            {isProcessing ? "Banning..." : "Ban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
