import { useState } from "react";
import {
  Copy,
  FileText,
  File,
  MoreHorizontal,
  Check,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface MessageActionsProps {
  message: string;
  isBot?: boolean;
  className?: string;
}

export function MessageActions({
  message,
  isBot = false,
  className = "",
}: MessageActionsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<"pdf" | "word" | null>(null);
  const [showActions, setShowActions] = useState(false);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand("copy");
      document.body.removeChild(textArea);
      return result;
    } catch (err) {
      console.error("Failed to copy text: ", err);
      return false;
    }
  };

  const handleCopy = async () => {
    try {
      const success = await copyToClipboard(message);
      if (success) {
        setCopied(true);
        toast.success(t("Copied to clipboard"));
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error(t("Failed to copy text"));
      }
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error(t("An error occurred while copying"));
    }
  };

  const handleExportPDF = async () => {
    setLoading("pdf");
    try {
      const { exportMessageToPDF } = await import("../../../lib/exportUtils");
      const exportMessage = {
        role: (isBot ? "bot" : "user") as "user" | "bot",
        text: message,
        timestamp: new Date().toLocaleString("vi-VN"),
      };
      await exportMessageToPDF(exportMessage);
      toast.success(t("PDF exported successfully"));
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error(t("Failed to export PDF"));
    } finally {
      setLoading(null);
    }
  };

  const handleExportWord = async () => {
    setLoading("word");
    try {
      const { exportMessageToWord } = await import("../../../lib/exportUtils");
      const exportMessage = {
        role: (isBot ? "bot" : "user") as "user" | "bot",
        text: message,
        timestamp: new Date().toLocaleString("vi-VN"),
      };
      await exportMessageToWord(exportMessage);
      toast.success(t("Word exported successfully"));
    } catch (error) {
      console.error("Word export failed:", error);
      toast.error(t("Failed to export Word"));
    } finally {
      setLoading(null);
    }
  };

  // Chỉ hiển thị actions cho tin nhắn bot hoặc khi có nội dung
  if (!isBot && !message.trim()) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Show actions button */}
      <button
        onClick={() => setShowActions(!showActions)}
        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          showActions ? "opacity-100" : ""
        }`}
        title={t("Options")}
      >
        <MoreHorizontal className="h-4 w-4 text-gray-500" />
      </button>

      {/* Actions menu */}
      {showActions && (
        <div className="absolute top-8 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[160px]">
          <div className="p-2 space-y-1">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{t("Copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>{t("Copy")}</span>
                </>
              )}
            </button>

            {/* PDF export button */}
            <button
              onClick={handleExportPDF}
              disabled={loading === "pdf"}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span>{t("Export PDF")}</span>
            </button>

            {/* Word export button */}
            <button
              onClick={handleExportWord}
              disabled={loading === "word"}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "word" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <File className="h-4 w-4" />
              )}
              <span>{t("Export Word")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}
