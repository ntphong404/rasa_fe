import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MessageSquare, Database } from "lucide-react";
import { GmailTab } from "../components/GmailTab";
import { FacebookTab } from "../components/FacebookTab";
import { QAPreviewTable } from "../components/QAPreviewTable";
import type { ExtractionRow } from "../api/types";

export function DataExtractionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"gmail" | "facebook">("gmail");
  const [rows, setRows] = useState<ExtractionRow[]>([]);

  function handleExtracted(newRows: ExtractionRow[]) {
    setRows(newRows);
  }

  function handleClear() {
    setRows([]);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm dark:border-white/10 dark:from-slate-950 dark:to-black">
          <div className="px-3 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                <div>
                  <h1 className="text-xl font-bold text-indigo-900 dark:text-indigo-200">
                    {t("Trích xuất Q&A từ Gmail / Facebook")}
                  </h1>
                  <p className="text-xs text-indigo-600 dark:text-indigo-300">
                    {t("Lấy câu hỏi-trả lời, phân tích intent qua Rasa, nhập vào chatbot")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pt-3" style={{ height: "calc(100vh - 120px)" }}>
          {/* Source selection tabs — chỉ hiện khi chưa có data */}
          {rows.length === 0 && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Tab buttons */}
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "gmail" ? "default" : "outline"}
                  onClick={() => setActiveTab("gmail")}
                  className="flex-1 gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {t("Gmail")}
                </Button>
                <Button
                  variant={activeTab === "facebook" ? "default" : "outline"}
                  onClick={() => setActiveTab("facebook")}
                  className="flex-1 gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t("Facebook Messenger")}
                </Button>
              </div>

              {/* Tab content */}
              {activeTab === "gmail" ? (
                <GmailTab onExtracted={handleExtracted} />
              ) : (
                <FacebookTab onExtracted={handleExtracted} />
              )}

              {/* Instructions */}
              <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-4 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div className="font-medium text-slate-700 dark:text-slate-300">
                  {t("Hướng dẫn")}:
                </div>
                {activeTab === "gmail" ? (
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>{t("Kết nối tài khoản Gmail (cần OAuth credentials)")}</li>
                    <li>{t("Nhập từ khóa tìm kiếm hoặc để trống để lấy tất cả email")}</li>
                    <li>{t("Nhấn Trích xuất để lấy cặp hỏi-đáp")}</li>
                  </ol>
                ) : (
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>{t("Tải dữ liệu Facebook: Settings → Your Information → Download (chọn Messages)")}</li>
                    <li>{t("Giải nén, tìm thư mục messages (chứa inbox/)")}</li>
                    <li>{t("Nén thư mục messages thành .zip rồi upload")}</li>
                    <li>{t("Xác nhận chủ tài khoản, chọn cuộc trò chuyện, nhấn Trích xuất")}</li>
                  </ol>
                )}
              </div>
            </div>
          )}

          {/* Q&A Preview Table */}
          {rows.length > 0 && (
            <QAPreviewTable rows={rows} onChange={setRows} onClear={handleClear} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DataExtractionPage;
