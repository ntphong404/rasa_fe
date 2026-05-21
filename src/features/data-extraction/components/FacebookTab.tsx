import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Upload, Search, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import * as api from "../api/service";
import type { ExtractionRow, FBUploadResult } from "../api/types";

interface Props {
  onExtracted: (rows: ExtractionRow[]) => void;
}

export function FacebookTab({ onExtracted }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"upload" | "configure" | "extracting">("upload");
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadResult, setUploadResult] = useState<FBUploadResult | null>(null);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedConvos, setSelectedConvos] = useState<Set<string>>(new Set());

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error(t("Chỉ hỗ trợ file .zip"));
      return;
    }

    setUploading(true);
    try {
      const result = await api.facebookUpload(file);
      setUploadResult(result);
      setSelectedOwner(result.owner || result.owner_candidates?.[0]?.name || "");
      setSelectedConvos(new Set(result.conversations.map((c) => c.id)));
      setStep("configure");
      toast.success(
        t("Tìm thấy {{count}} tin nhắn trong {{convos}} cuộc trò chuyện",({
          count: result.message_count,
          convos: result.conversations.length,
        }))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("Lỗi khi upload file"));
    } finally {
      setUploading(false);
    }
  }

  async function handleExtract() {
    if (!uploadResult || !selectedOwner) return;
    setExtracting(true);
    try {
      const selected = selectedConvos.size > 0 ? Array.from(selectedConvos) : undefined;
      const result = await api.facebookExtract(
        uploadResult.extract_id,
        selectedOwner,
        selected
      );
      const rows: ExtractionRow[] = result.qa_pairs.map((p, i) => ({
        id: `fb_${i}`,
        question: p.question,
        answer: p.answer,
        conversation: p.conversation,
        status: "pending",
      }));
      toast.success(t("Trích xuất {{count}} dữ liệu từ Facebook", { count: result.total }));
      onExtracted(rows);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("Lỗi khi trích xuất"));
    } finally {
      setExtracting(false);
    }
  }

  function toggleConvo(id: string) {
    setSelectedConvos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAllConvos() {
    if (!uploadResult) return;
    setSelectedConvos(new Set(uploadResult.conversations.map((c) => c.id)));
  }

  function clearConvos() {
    setSelectedConvos(new Set());
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Upload */}
      {step === "upload" && (
        <div
          className="cursor-pointer rounded-lg border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-10 text-center shadow-sm transition-all hover:border-blue-400 hover:shadow-lg dark:border-blue-400/50 dark:from-slate-900 dark:to-slate-900"
          onClick={() => document.getElementById("fb-zip-input")?.click()}
          onDrop={(e) => {
            e.preventDefault();
            handleUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            id="fb-zip-input"
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Upload className="h-12 w-12 text-blue-400 mx-auto mb-3" />
          <div className="mb-2 text-xl font-bold text-blue-900 dark:text-blue-200">
            {uploading ? t("Đang xử lý...") : t("Kéo thả file .zip thư mục messages vào đây")}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {t("Hoặc click để chọn file từ máy tính")}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {t("Zip thư mục messages (chứa inbox/) từ Facebook data export")}
          </div>
          {uploading && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-3 text-blue-500" />}
        </div>
      )}

      {/* Step 2: Configure owner + conversations */}
      {step === "configure" && uploadResult && (
        <div className="space-y-4">
          {/* Owner selection */}
          <div className="rounded-lg border bg-card p-4">
            <div className="font-medium text-sm mb-3">{t("Chọn chủ tài khoản (người trả lời)")}</div>
            <div className="grid gap-2">
              {uploadResult.owner_candidates.map((c) => (
                <label
                  key={c.name}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer hover:bg-accent"
                >
                  <input
                    type="radio"
                    name="owner"
                    checked={selectedOwner === c.name}
                    onChange={() => setSelectedOwner(c.name)}
                    className="accent-indigo-600"
                  />
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {t("Xuất hiện trong {{count}} cuộc trò chuyện", { count: c.conversation_count })}
                  </span>
                  {c.name === uploadResult.owner && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Conversation selection */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-sm">
                {t("Chọn cuộc trò chuyện")} ({selectedConvos.size}/{uploadResult.conversations.length})
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllConvos}>
                  {t("Chọn tất cả")}
                </Button>
                <Button variant="ghost" size="sm" onClick={clearConvos}>
                  {t("Bỏ chọn")}
                </Button>
              </div>
            </div>
            <div className="grid gap-1 max-h-60 overflow-auto">
              {uploadResult.conversations.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded border p-2 text-sm cursor-pointer hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={selectedConvos.has(c.id)}
                    onChange={() => toggleConvo(c.id)}
                    className="accent-indigo-600"
                  />
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {c.message_count} {t("tin nhắn")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Extract button */}
          <Button
            onClick={handleExtract}
            disabled={extracting || !selectedOwner || selectedConvos.size === 0}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {extracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {extracting ? t("Đang trích xuất...") : t("Trích xuất dữ liệu")}
          </Button>
        </div>
      )}
    </div>
  );
}
