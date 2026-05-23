import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  FileArchive,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  AlertCircle,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { myModelService } from "../api/service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { useChatbotStore } from "@/store/chatbot";
import { Checkbox } from "@/components/ui/checkbox";

interface PushModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPushSuccess: () => void;
}

type UploadStep = "idle" | "presigning" | "uploading" | "saving" | "done" | "error";

export function PushModelDialog({
  open,
  onOpenChange,
  onPushSuccess,
}: PushModelDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<UploadStep>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isManager = user?.roles?.some((r: any) => (r.name || r)?.toLowerCase() === "manager") ?? false;
  const managerAssignedBotId = user?.managedBotIds?.[0] ?? null;
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const chatbots = useChatbotStore((state) => state.chatbots);

  const [applicableBotIds, setApplicableBotIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (selectedBotId && selectedBotId !== "global") {
        setApplicableBotIds([selectedBotId]);
      } else {
        setApplicableBotIds([]);
      }
    }
  }, [open, selectedBotId]);

  const isValidFile = (f: File) => {
    const name = f.name.toLowerCase();
    return name.endsWith(".tar.gz") || name.endsWith(".zip");
  };

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    if (!isValidFile(selected)) {
      toast.error(t("Only .zip or .tar.gz files are allowed"));
      return;
    }
    setFile(selected);
    setStep("idle");
    setProgress(0);
    setErrorMsg("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;

    const targetBotIds = isManager
      ? managerAssignedBotId
        ? [managerAssignedBotId]
        : []
      : applicableBotIds;

    if (targetBotIds.length === 0) {
      toast.error(t("Please select at least one target chatbot"));
      return;
    }

    setErrorMsg("");

    try {
      setStep("presigning");
      setProgress(10);
      const presignRes = await myModelService.generatePresignedUrl({
        botIds: targetBotIds,
        originalFileName: file.name,
        fileSize: file.size,
      });
      setProgress(25);

      setStep("uploading");
      await uploadWithProgress(presignRes.data.uploadUrl, file, (pct) => {
        setProgress(25 + Math.round(pct * 0.6));
      });

      setProgress(85);
      setStep("saving");
      await myModelService.pushModel(
        presignRes.data.objectName,
        targetBotIds,
        description || undefined
      );

      setProgress(100);
      setStep("done");
      toast.success(t("Model uploaded successfully"));

      setTimeout(() => {
        resetDialog();
        onOpenChange(false);
        onPushSuccess();
      }, 1200);
    } catch (err: any) {
      setStep("error");
      const msg = err?.response?.data?.message || err?.message || t("Upload failed");
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const uploadWithProgress = (
    url: string,
    f: File,
    onProgress: (pct: number) => void
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
      xhr.onerror = () => reject(new Error(t("Network error")));
      xhr.send(f);
    });

  const resetDialog = () => {
    setFile(null);
    setDescription("");
    setStep("idle");
    setProgress(0);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (step === "uploading" || step === "presigning" || step === "saving") return;
    resetDialog();
    onOpenChange(false);
  };

  const isLoading = step === "presigning" || step === "uploading" || step === "saving";

  const stepLabel: Record<UploadStep, string> = {
    idle: "",
    presigning: t("Requesting upload URL..."),
    uploading: t("Uploading to MinIO..."),
    saving: t("Saving model metadata..."),
    done: t("Upload complete!"),
    error: t("Upload failed"),
  };

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : "0";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 overflow-hidden gap-0 flex flex-col">
        <DialogHeader className="px-6 py-5 bg-gradient-to-r from-cyan-50 to-blue-50 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Upload className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-cyan-900">{t("Push Model to MinIO")}</DialogTitle>
              <DialogDescription className="text-cyan-700">
                {t("Upload a .zip or .tar.gz model file to MinIO storage")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              {t("Supported formats")}: <span className="font-semibold text-slate-900">.zip</span>, <span className="font-semibold text-slate-900">.tar.gz</span>
            </p>
          </div>

          {/* Drop zone / File Selection */}
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-10 text-center transition-colors",
              isDragOver
                ? "border-cyan-500 bg-cyan-50"
                : "border-slate-200 hover:border-cyan-400 hover:bg-slate-50",
              file && "border-emerald-500 bg-emerald-50/60",
              isLoading && "pointer-events-none opacity-80"
            )}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.tar.gz,.gz"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              disabled={isLoading}
            />

            {file ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="p-4 bg-emerald-100 rounded-2xl">
                    <FileArchive className="h-12 w-12 text-emerald-600" />
                  </div>
                  {!isLoading && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); resetDialog(); }}
                      className="absolute -top-2 -right-2 p-1.5 bg-white border shadow-md rounded-full text-slate-500 hover:text-red-500 transition-colors"
                      aria-label={t("Remove file")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 truncate max-w-[300px]">{file.name}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      <HardDrive className="h-3 w-3 mr-1" />
                      {fileSizeMB} MB
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-cyan-100 rounded-2xl">
                  <Upload className="h-10 w-10 text-cyan-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{t("Select Model File")}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {t("Drag and drop or click to browse files")}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">.zip</span>
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">.tar.gz</span>
                </div>
              </div>
            )}
          </div>

          {/* Bot Selection */}
          {!isManager && (
            <div className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {t("Target Chatbots")}
                <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
                {chatbots.map((bot) => (
                  <div
                    key={bot._id}
                    className="flex items-center space-x-2 bg-slate-50 p-2 rounded border"
                  >
                    <Checkbox
                      id={`push-bot-${bot._id}`}
                      checked={applicableBotIds.includes(bot.botId)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setApplicableBotIds([...applicableBotIds, bot.botId]);
                        } else {
                          setApplicableBotIds(
                            applicableBotIds.filter((id) => id !== bot.botId)
                          );
                        }
                      }}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={`push-bot-${bot._id}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-1 truncate"
                    >
                      {bot.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white border rounded-lg p-4 shadow-sm space-y-2">
            <Label htmlFor="push-model-desc" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FileText className="h-4 w-4 text-slate-500" />
              {t("Description")}
              <span className="text-xs font-normal text-slate-400">({t("optional")})</span>
            </Label>
            <Textarea
              id="push-model-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("What's special about this version?")}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Progress Section */}
          {(isLoading || step === "done" || step === "error") && (
            <div className="p-4 bg-white rounded-lg border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : step === "error" ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-cyan-600 animate-spin" />
                  )}
                  <span className={cn(
                    "text-sm font-semibold",
                    step === "done" && "text-green-600",
                    step === "error" && "text-red-500",
                  )}>
                    {stepLabel[step]}
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-cyan-700">{progress}%</span>
              </div>
              <Progress
                value={progress}
                className={cn(
                  "h-2",
                  step === "done" && "[&>div]:bg-green-500",
                  step === "error" && "[&>div]:bg-red-500",
                  !["done", "error"].includes(step) && "[&>div]:bg-cyan-600"
                )}
              />
              {step === "error" && errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg mt-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600">{errorMsg}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6"
          >
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isLoading || step === "done"}
            className="min-w-[160px] bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
            id="push-model-submit-btn"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isLoading ? t("Uploading...") : t("Push to MinIO")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
