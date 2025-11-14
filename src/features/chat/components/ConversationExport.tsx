import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, File, Loader2 } from "lucide-react";
import {
  exportToPDF,
  exportToWord,
  ExportMessage,
} from "../../../lib/exportUtils";
import { IChatMessage } from "@/interfaces/chat.interface";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import toast from "react-hot-toast";

interface ConversationExportProps {
  messages: IChatMessage[];
  conversationTitle?: string;
  className?: string;
}

export function ConversationExport({
  messages,
  conversationTitle = "Cuộc trò chuyện",
  className = "",
}: ConversationExportProps) {
  const [loading, setLoading] = useState<"pdf" | "word" | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const userId = useCurrentUserId();

  // Calculate menu position
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeight = 85; // Reduced estimated menu height for compact design

      // Check if menu would overflow viewport
      const wouldOverflow = rect.bottom + menuHeight + 8 > viewportHeight;

      setMenuPos({
        top: wouldOverflow ? rect.top - menuHeight - 8 : rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 160), // Adjusted for smaller menu width
      });
    }
  }, [showMenu]);

  const convertToExportFormat = (
    chatMessages: IChatMessage[]
  ): ExportMessage[] => {
    return chatMessages.map((msg) => ({
      role: msg.recipient_id === userId ? "user" : "bot",
      text: msg.text,
      timestamp: new Date().toISOString(),
    }));
  };

  const handleExportPDF = async () => {
    if (messages.length === 0) {
      toast.error("Không có tin nhắn nào để xuất");
      return;
    }

    setLoading("pdf");
    try {
      const exportMessages = convertToExportFormat(messages);
      await exportToPDF(exportMessages, conversationTitle);
      toast.success("Đã xuất file PDF thành công!");
      setShowMenu(false);
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Không thể xuất file PDF");
    } finally {
      setLoading(null);
    }
  };

  const handleExportWord = async () => {
    if (messages.length === 0) {
      toast.error("Không có tin nhắn nào để xuất");
      return;
    }

    setLoading("word");
    try {
      const exportMessages = convertToExportFormat(messages);
      await exportToWord(exportMessages, conversationTitle);
      toast.success("Đã xuất file Word thành công!");
      setShowMenu(false);
    } catch (error) {
      console.error("Word export failed:", error);
      toast.error("Không thể xuất file Word");
    } finally {
      setLoading(null);
    }
  };

  if (messages.length === 0) return null;

  return (
    <>
      <div className={className}>
        {/* Export button */}
        <button
          ref={buttonRef}
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
          title="Xuất cuộc trò chuyện"
        >
          <Download className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Export menu - rendered using Portal to avoid overflow */}
      {showMenu &&
        createPortal(
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div
              className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px] overflow-hidden"
              style={{
                top: `${menuPos.top}px`,
                left: `${menuPos.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                Xuất file
              </div>

              {/* Menu items */}
              <div className="p-1">
                {/* PDF export */}
                <button
                  onClick={handleExportPDF}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === "pdf" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className="text-xs">
                    {loading === "pdf" ? "Đang xuất..." : "PDF"}
                  </span>
                </button>

                {/* Word export */}
                <button
                  onClick={handleExportWord}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === "word" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  ) : (
                    <File className="h-3.5 w-3.5 text-blue-500" />
                  )}
                  <span className="text-xs">
                    {loading === "word" ? "Đang xuất..." : "Word"}
                  </span>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
