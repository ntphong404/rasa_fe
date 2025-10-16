import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// ...existing code... (keeps other imports)
import { useTranslation } from "react-i18next";
import { IAction } from "@/interfaces/action.interface";

interface ActionDetailsDialogProps {
  action: IAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ActionDetailsDialog({ action, open, onOpenChange }: ActionDetailsDialogProps) {
  const { t } = useTranslation();

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[800px] max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{t("Action Details")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <strong>{t("Name")}:</strong> {action.name}
          </div>
          <div>
            <strong>{t("Description")}:</strong> {action.description || t("No description")}
          </div>
          <div>
            <strong>{t("Created At")}:</strong> {new Date(action.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>{t("Code")}:</strong>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto font-mono mt-2">{action.define || t("No definition")}</pre>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
