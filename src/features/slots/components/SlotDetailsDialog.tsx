import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Users, Code, Tag, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ISlot } from "@/interfaces/slot.interface";
import { slotService } from "../api/service";

type SlotDetailsDialogProps = {
  slot: ISlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botNameMap: Map<string, string>;
};

const formatDate = (value?: string | Date) => (value ? new Date(value).toLocaleString("vi-VN") : "-");

export function SlotDetailsDialog({ slot, open, onOpenChange, botNameMap }: SlotDetailsDialogProps) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<ISlot | null>(slot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slot?._id) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await slotService.getSlotById(slot._id);
        setDetail(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Failed to fetch slot details"));
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [open, slot?._id, t]);

  if (!slot) return null;

  const currentSlot = detail || slot;
  const relatedRefs = [currentSlot.entity, currentSlot.intent, currentSlot.action].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 border-b dark:border-white/10 px-6 py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-indigo-900 dark:text-indigo-200">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              {currentSlot.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-indigo-700 dark:text-indigo-300">
              {currentSlot.description || t("No description")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <div className="text-red-500 font-semibold mb-2">{t("Error loading slot")}</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="surface-card-strong p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
                  <Code className="h-4 w-4 text-purple-600" />
                  {t("Definition")}
                </h3>
                <pre className="text-sm whitespace-pre-wrap rounded-md bg-muted/40 p-4 font-mono leading-5">
                  {currentSlot.define || "-"}
                </pre>
              </div>

              <div className="surface-card-strong p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
                  <Users className="h-4 w-4 text-blue-600" />
                  {t("Chatbots")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(currentSlot.botIds || []).length ? (
                    currentSlot.botIds.map((botId) => (
                      <Badge key={botId} variant="secondary">
                        {botNameMap.get(botId) || botId}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              <div className="surface-card-strong p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
                  <Tag className="h-4 w-4 text-cyan-600" />
                  {t("References")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {relatedRefs.length ? (
                    relatedRefs.map((ref) => (
                      <Badge key={String(ref)} variant="outline">
                        {String(ref)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              <div className="surface-card-strong p-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="font-medium text-muted-foreground">Status</div>
                  <div>{currentSlot.deleted ? t("Deleted") : t("Active")}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Roles</div>
                  <div>{currentSlot.roles?.length ? currentSlot.roles.join(", ") : "-"}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Created</div>
                  <div>{formatDate(currentSlot.createdAt)}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Updated</div>
                  <div>{formatDate(currentSlot.updatedAt)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}