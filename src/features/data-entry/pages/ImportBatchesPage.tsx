import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trash2, ToggleLeft, ToggleRight, RefreshCw, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { importService, IImportBatch } from "../api/service";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  manual: "Manual",
  web_import: "Web Import",
  excel_script: "Script",
  api: "API",
};

export function ImportBatchesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [batches, setBatches] = useState<IImportBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Read botId from localStorage (same pattern as other pages)
  const botId = localStorage.getItem("selectedBotId") ?? "";
  const scopedBotId = botId && botId !== "global" ? botId : undefined;

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await importService.getBatches(scopedBotId);
      setBatches(data);
    } catch {
      toast.error(t("Failed to load import batches"));
    } finally {
      setLoading(false);
    }
  }, [scopedBotId, t]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleToggle = async (batch: IImportBatch) => {
    if (!scopedBotId) {
      toast.error(t("Please select a specific chatbot to toggle a batch"));
      return;
    }
    const newActive = batch.activeCount === 0;
    setTogglingId(batch.importBatchId);
    try {
      await importService.toggleBatch(scopedBotId, batch.importBatchId, newActive);
      toast.success(newActive ? t("Batch activated") : t("Batch deactivated"));
      fetchBatches();
    } catch {
      toast.error(t("Failed to update batch"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!scopedBotId) {
      toast.error(t("Please select a specific chatbot to delete a batch"));
      return;
    }
    const ok = window.confirm(t("This will permanently delete this batch. Continue?"));
    if (!ok) return;
    setDeletingId(batchId);
    try {
      await importService.deleteBatch(scopedBotId, batchId);
      toast.success(t("Import batch deleted"));
      setBatches((prev) => prev.filter((b) => b.importBatchId !== batchId));
    } catch {
      toast.error(t("Failed to delete batch"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/add-data")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t("Import Batches")}</h1>
          <p className="text-sm text-muted-foreground">{t("Manage imported data batches and toggle training inclusion")}</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={fetchBatches} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {t("Refresh")}
        </Button>
      </div>

      {!botId && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          {t("Please select a chatbot first to view import batches.")}
        </div>
      )}

      {botId === "global" && (
        <div className="rounded-md border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800">
          {t("Global mode: displaying batches across all chatbots. Select a specific chatbot to toggle or delete a batch.")}
        </div>
      )}

      {batches.length === 0 && !loading && botId && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Package className="h-10 w-10 opacity-40" />
          <p className="text-sm">{t("No import batches found")}</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/add-data/import")}>
            {t("Import from file")}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {batches.map((batch) => {
          const isActive = batch.activeCount > 0;
          return (
            <div
              key={batch.importBatchId}
              className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {batch.importLabel ?? batch.importBatchId}
                    </span>
                    {batch.sourceType && (
                      <Badge variant="outline" className="text-xs">
                        {SOURCE_TYPE_LABELS[batch.sourceType] ?? batch.sourceType}
                      </Badge>
                    )}
                    <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                      {isActive ? t("Active") : t("Inactive")}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {batch.importBatchId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(batch.createdAt).toLocaleString()} · {batch.totalCount} {t("items")}
                    {" "}&middot; {batch.activeCount}/{batch.totalCount} {t("active")}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(batch)}
                    disabled={togglingId === batch.importBatchId}
                    title={isActive ? t("Deactivate batch") : t("Activate batch")}
                  >
                    {isActive ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="ml-1 text-xs">{isActive ? t("Active") : t("Inactive")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === batch.importBatchId}
                    onClick={() => handleDelete(batch.importBatchId)}
                    title={t("Delete batch")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Counts row */}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t pt-2">
                {Object.entries(batch.counts)
                  .filter(([, v]) => v > 0)
                  .map(([key, value]) => (
                    <span key={key} className="capitalize">
                      {key}: <strong>{value}</strong>
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
