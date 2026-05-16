import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Unplug, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as api from "../api/service";
import type { ExtractionRow } from "../api/types";

interface Props {
  onExtracted: (rows: ExtractionRow[]) => void;
}

export function GmailTab({ onExtracted }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gmailRefreshStatus();
  }, []);

  // Kiểm tra callback từ URL (sau khi OAuth redirect về)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      toast.success(t("Gmail connected: {{email}}", { email: params.get("email") }));
      window.history.replaceState({}, "", "/data-extraction");
      gmailRefreshStatus();
    }
  }, []);

  async function gmailRefreshStatus() {
    try {
      const s = await api.gmailGetStatus();
      setStatus(s);
    } catch {
      setStatus({ connected: false, email: null });
    }
  }

  async function handleConnect() {
    try {
      const result = await api.gmailConnect();
      if (result.auth_url) {
        window.location.href = result.auth_url;
      } else if (result.connected) {
        await gmailRefreshStatus();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("Không thể kết nối Gmail"));
    }
  }

  async function handleDisconnect() {
    try {
      await api.gmailDisconnect();
      setStatus({ connected: false, email: null });
      toast.success(t("Đã ngắt kết nối Gmail"));
    } catch {
      toast.error(t("Lỗi khi ngắt kết nối"));
    }
  }

  async function handleExtract() {
    setLoading(true);
    try {
      const result = await api.gmailExtract(query);
      const rows: ExtractionRow[] = result.qa_pairs.map((p, i) => ({
        id: `gmail_${i}`,
        question: p.question,
        answer: p.answer,
        conversation: p.conversation,
        status: "pending",
      }));
      toast.success(t("Trích xuất {{count}} cặp Q&A từ Gmail", { count: result.total }));
      onExtracted(rows);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("Lỗi khi trích xuất Gmail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Kết nối Gmail */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-red-500" />
            <div>
              <div className="font-medium text-sm">
                {status?.connected
                  ? t("Đã kết nối: {{email}}", { email: status.email })
                  : t("Chưa kết nối Gmail")}
              </div>
              {status?.connected && (
                <div className="text-xs text-muted-foreground">
                  {t("Sẵn sàng trích xuất Q&A từ email")}
                </div>
              )}
            </div>
          </div>
          {status?.connected ? (
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2">
              <Unplug className="h-4 w-4" />
              {t("Ngắt kết nối")}
            </Button>
          ) : (
            <Button size="sm" onClick={handleConnect} className="gap-2 bg-red-500 hover:bg-red-600">
              <Mail className="h-4 w-4" />
              {t("Kết nối Gmail")}
            </Button>
          )}
        </div>
      </div>

      {/* Search query + Extract */}
      {status?.connected && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div>
            <label className="text-sm font-medium">{t("Từ khóa tìm kiếm (tùy chọn)")}</label>
            <p className="text-xs text-muted-foreground mb-2">
              VD: after:2025/01/01 from:truong.edu.vn
            </p>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Nhập từ khóa Gmail hoặc để trống để lấy tất cả...")}
                onKeyDown={(e) => e.key === "Enter" && handleExtract()}
              />
              <Button onClick={handleExtract} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? t("Đang trích xuất...") : t("Trích xuất")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
