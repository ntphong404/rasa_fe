import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  CheckSquare,
  Eraser,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createRagServiceInstance } from "@/features/chat/api/ragService";
import { useChatbotStore } from "@/store/chatbot";
import {
  DocStatus,
  LightRagDocumentStatusItem,
  LightRagPipelineStatusResponse,
} from "@/interfaces/rag.interface";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type StatusFilter = "all" | DocStatus;

const STATUS_TABS: Array<{ key: StatusFilter; tone: string }> = [
  { key: "all", tone: "" },
  { key: "processed", tone: "text-green-600" },
  { key: "preprocessed", tone: "text-purple-600" },
  { key: "processing", tone: "text-blue-600" },
  { key: "pending", tone: "text-yellow-600" },
  { key: "failed", tone: "text-red-600" },
];

const statusBadgeClass: Record<DocStatus, string> = {
  processed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  preprocessed: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  processing: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
  failed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
};

const PAGE_SIZE = 10;

export function ContextDocumentsPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  
  // Get chatbot selection from store
  const selectedManagementBotId = useChatbotStore((state) => state.selectedManagementBotId);
  const setSelectedManagementBotId = useChatbotStore((state) => state.setSelectedManagementBotId);
  const chatbots = useChatbotStore((state) => state.chatbots);
  
  // Auto-select first chatbot if on context-docs with "global" selected
  useEffect(() => {
    if ((!selectedManagementBotId || selectedManagementBotId === "global") && chatbots.length > 0) {
      setSelectedManagementBotId(chatbots[0].botId);
    }
  }, [selectedManagementBotId, chatbots, setSelectedManagementBotId]);
  
  // Find selected chatbot and get ragUrl
  const selectedChatbot = useMemo(() => {
    if (!selectedManagementBotId || selectedManagementBotId === "global") return null;
    return chatbots.find((bot) => bot.botId === selectedManagementBotId);
  }, [selectedManagementBotId, chatbots]);
  
  const ragUrl = selectedChatbot?.ragUrl;
  const isVi = (i18n.resolvedLanguage || i18n.language || "vi").toLowerCase().startsWith("vi");
  const dateLocale = isVi ? "vi-VN" : "en-US";
  const text = useMemo(
    () =>
      isVi
        ? {
            pageTitle: "Tài liệu ngữ cảnh",
            statusAll: "Tất cả",
            statusProcessed: "Hoàn tất",
            statusPreprocessed: "Tiền xử lý",
            statusProcessing: "Đang xử lý",
            statusPending: "Chờ xử lý",
            statusFailed: "Thất bại",
            scan: "Quét tài liệu mới",
            retry: "Thử lại pipeline",
            pipeline: "Pipeline",
            refresh: "Làm mới",
            deleteSelected: "Xóa đã chọn",
            clearAll: "Xóa toàn bộ",
            uploading: "Đang tải lên...",
            upload: "Tải lên tài liệu",
            searchPlaceholder: "Tìm theo tên file hoặc tóm tắt...",
            unselectPage: "Bỏ chọn trang này",
            selectPage: "Chọn trang này",
            selectAllPage: "Chọn tất cả trang",
            saveSelection: "Lưu lựa chọn",
            saving: "Đang lưu...",
            noResults: "Không tìm thấy tài liệu nào",
            noDocs: "Chưa có tài liệu nào. Hãy tải lên tài liệu đầu tiên!",
            colSelect: "Chọn",
            colName: "Tên tài liệu",
            colStatus: "Trạng thái",
            colSummary: "Tóm tắt",
            colChunks: "Chunks",
            colUpdated: "Cập nhật",
            colActions: "Thao tác",
            page: "Trang",
            showing: "Hiển thị",
            prev: "← Trước",
            next: "Sau →",
            deleteDocTitle: "Xóa tài liệu",
            deleteDocDesc: "Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.",
            delete: "Xóa",
            cancel: "Hủy",
            deleteSelectedTitle: "Xóa danh sách đã chọn",
            deleteSelectedDesc: "Bạn có chắc muốn xóa {{count}} tài liệu đã chọn?",
            clearTitle: "Xóa toàn bộ tài liệu",
            clearDesc: "Hành động này sẽ xóa toàn bộ tài liệu đã nạp. Bạn có chắc chắn?",
            clearConfirm: "Xóa toàn bộ",
            pipelineTitle: "Trạng thái pipeline",
            pipelineDesc: "Theo dõi tiến trình xử lý tài liệu theo thời gian thực",
            busy: "Bận",
            pending: "Đang chờ",
            batch: "Batch",
            cancelPipeline: "Hủy pipeline",
            job: "Job",
            startedAt: "Bắt đầu",
            latestMessage: "Tin nhắn mới nhất",
            noPipelineLogs: "Chưa có log pipeline.",
            close: "Đóng",
            unknownName: "Không có tên",
            saveSelectionSuccess: "Đã lưu {{count}} tài liệu đã chọn",
            saveSelectionFail: "Không thể lưu lựa chọn. Vui lòng thử lại.",
            loadDocumentsFail: "Không thể tải danh sách tài liệu",
            scanSuccess: "Đã bắt đầu quét tài liệu mới",
            scanFail: "Không thể quét tài liệu mới",
            retrySuccess: "Đã yêu cầu thử lại pipeline",
            retryFail: "Không thể thử lại pipeline",
            cancelPipelineSuccess: "Đã gửi yêu cầu hủy pipeline",
            cancelPipelineFail: "Không thể hủy pipeline",
            uploadSuccess: "Tải lên tài liệu {{fileName}} thành công",
            uploadFail: "Không thể tải lên tài liệu. Vui lòng thử lại.",
            deleteSuccess: "Đã xóa tài liệu {{fileName}}",
            deleteFail: "Không thể xóa tài liệu. Vui lòng thử lại.",
            deleteSelectedSuccess: "Đã gửi yêu cầu xóa {{count}} tài liệu",
            deleteSelectedFail: "Không thể xóa danh sách tài liệu đã chọn",
            clearSuccess: "Đã xóa toàn bộ tài liệu",
            clearFail: "Không thể xóa toàn bộ tài liệu",
          }
        : {
            pageTitle: "Context Documents",
            statusAll: "All",
            statusProcessed: "Processed",
            statusPreprocessed: "Preprocessed",
            statusProcessing: "Processing",
            statusPending: "Pending",
            statusFailed: "Failed",
            scan: "Scan New Docs",
            retry: "Retry Pipeline",
            pipeline: "Pipeline",
            refresh: "Refresh",
            deleteSelected: "Delete Selected",
            clearAll: "Clear All",
            uploading: "Uploading...",
            upload: "Upload Documents",
            searchPlaceholder: "Search by file name or summary...",
            unselectPage: "Unselect This Page",
            selectPage: "Select This Page",
            selectAllPage: "Select All on Page",
            saveSelection: "Save Selection",
            saving: "Saving...",
            noResults: "No documents found",
            noDocs: "No documents yet. Upload your first document!",
            colSelect: "Select",
            colName: "Document Name",
            colStatus: "Status",
            colSummary: "Summary",
            colChunks: "Chunks",
            colUpdated: "Updated",
            colActions: "Actions",
            page: "Page",
            showing: "Showing",
            prev: "← Prev",
            next: "Next →",
            deleteDocTitle: "Delete Document",
            deleteDocDesc: "Are you sure you want to delete this document? This action cannot be undone.",
            delete: "Delete",
            cancel: "Cancel",
            deleteSelectedTitle: "Delete Selected Documents",
            deleteSelectedDesc: "Are you sure you want to delete {{count}} selected documents?",
            clearTitle: "Clear All Documents",
            clearDesc: "This will remove all ingested documents. Are you sure?",
            clearConfirm: "Clear All",
            pipelineTitle: "Pipeline Status",
            pipelineDesc: "Monitor document processing progress in real time",
            busy: "Busy",
            pending: "Pending",
            batch: "Batch",
            cancelPipeline: "Cancel Pipeline",
            job: "Job",
            startedAt: "Started",
            latestMessage: "Latest Message",
            noPipelineLogs: "No pipeline logs yet.",
            close: "Close",
            unknownName: "Unnamed",
            saveSelectionSuccess: "Saved {{count}} selected documents",
            saveSelectionFail: "Failed to save selection. Please try again.",
            loadDocumentsFail: "Failed to load documents",
            scanSuccess: "Started scanning new documents",
            scanFail: "Could not scan new documents",
            retrySuccess: "Retry pipeline requested",
            retryFail: "Could not retry pipeline",
            cancelPipelineSuccess: "Cancel pipeline request sent",
            cancelPipelineFail: "Could not cancel pipeline",
            uploadSuccess: "Uploaded {{fileName}} successfully",
            uploadFail: "Failed to upload document. Please try again.",
            deleteSuccess: "Deleted {{fileName}}",
            deleteFail: "Failed to delete document. Please try again.",
            deleteSelectedSuccess: "Delete request sent for {{count}} documents",
            deleteSelectedFail: "Could not delete selected documents",
            clearSuccess: "All documents removed",
            clearFail: "Could not remove all documents",
          },
    [isVi]
  );
  const statusTabLabel: Record<StatusFilter, string> = {
    all: text.statusAll,
    processed: text.statusProcessed,
    preprocessed: text.statusPreprocessed,
    processing: text.statusProcessing,
    pending: text.statusPending,
    failed: text.statusFailed,
  };
  const statusLabel: Record<DocStatus, string> = {
    processed: text.statusProcessed,
    preprocessed: text.statusPreprocessed,
    processing: text.statusProcessing,
    pending: text.statusPending,
    failed: text.statusFailed,
  };
  const [documentsByStatus, setDocumentsByStatus] = useState<
    Record<string, LightRagDocumentStatusItem[]>
  >({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pipelineStatus, setPipelineStatus] = useState<LightRagPipelineStatusResponse | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [savedSelectedDocIds, setSavedSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pipelinePollingRef = useRef<number | null>(null);

  useEffect(() => {
    loadSavedSelection();
  }, []);

  useEffect(() => {
    if (ragUrl) {
      fetchDocuments();
    }
  }, [ragUrl]);

  useEffect(() => {
    const availableIds = new Set(
      Object.values(documentsByStatus)
        .flat()
        .map((doc) => doc.id)
    );
    setSelectedDocIds((prev) => prev.filter((id) => availableIds.has(id)));
    setSavedSelectedDocIds((prev) => prev.filter((id) => availableIds.has(id)));
  }, [documentsByStatus]);

  useEffect(() => {
    if (!pipelineDialogOpen) {
      if (pipelinePollingRef.current) {
        window.clearInterval(pipelinePollingRef.current);
        pipelinePollingRef.current = null;
      }
      return;
    }

    const loadPipelineStatus = async () => {
      if (!ragUrl) return;
      try {
        const ragServiceInstance = createRagServiceInstance(ragUrl);
        const status = await ragServiceInstance.getPipelineStatus();
        setPipelineStatus(status);
      } catch (error) {
        console.error("Error fetching pipeline status:", error);
      }
    };

    loadPipelineStatus();
    pipelinePollingRef.current = window.setInterval(loadPipelineStatus, 2000);

    return () => {
      if (pipelinePollingRef.current) {
        window.clearInterval(pipelinePollingRef.current);
        pipelinePollingRef.current = null;
      }
    };
  }, [pipelineDialogOpen]);

  const loadSavedSelection = () => {
    const saved = localStorage.getItem("rag_selected_docs");
    if (saved) {
      const ids = JSON.parse(saved) as string[];
      setSelectedDocIds(ids);
      setSavedSelectedDocIds(ids);
    }
  };

  const handleSaveSelection = async () => {
    try {
      setIsSaving(true);
      localStorage.setItem("rag_selected_docs", JSON.stringify(selectedDocIds));
      setSavedSelectedDocIds([...selectedDocIds]);
      toast.success(t(text.saveSelectionSuccess, { count: selectedDocIds.length }));
    } catch (error) {
      console.error("Error saving selection:", error);
      toast.error(text.saveSelectionFail);
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges =
    JSON.stringify([...selectedDocIds].sort()) !==
    JSON.stringify([...savedSelectedDocIds].sort());

  const allDocuments = useMemo(() => {
    return Object.values(documentsByStatus).flat();
  }, [documentsByStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: allDocuments.length,
      processed: 0,
      preprocessed: 0,
      processing: 0,
      pending: 0,
      failed: 0,
    };

    for (const doc of allDocuments) {
      counts[doc.status] += 1;
    }

    return counts;
  }, [allDocuments]);

  const fetchDocuments = async () => {
    if (!ragUrl) {
      toast.error(t("Please select a chatbot with RAG URL"));
      return;
    }
    try {
      setIsLoading(true);
      const ragServiceInstance = createRagServiceInstance(ragUrl);
      const response = await ragServiceInstance.listDocumentsStatuses();
      setDocumentsByStatus(response.statuses || {});
    } catch (error) {
      console.error("Error fetching documents:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg.startsWith("Invalid RAG URL")) {
        toast.error(`RAG URL không hợp lệ: ${ragUrl}`);
      } else {
        toast.error(text.loadDocumentsFail);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanDocuments = async () => {
    if (!ragUrl) {
      toast.error(t("Please select a chatbot with RAG URL"));
      return;
    }
    try {
      setIsActionLoading(true);
      const ragServiceInstance = createRagServiceInstance(ragUrl);
      const result = await ragServiceInstance.scanDocuments();
      toast.success(result.message || text.scanSuccess);
      await fetchDocuments();
    } catch (error) {
      console.error("Error scanning documents:", error);
      toast.error(text.scanFail);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRetryPipeline = async () => {
    if (!ragUrl) {
      toast.error(t("Please select a chatbot with RAG URL"));
      return;
    }
    try {
      setIsActionLoading(true);
      const ragServiceInstance = createRagServiceInstance(ragUrl);
      const result = await ragServiceInstance.reprocessFailedDocuments();
      toast.success(result.message || text.retrySuccess);
      await fetchDocuments();
    } catch (error) {
      console.error("Error retrying failed documents:", error);
      toast.error(text.retryFail);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelPipeline = async () => {
    if (!ragUrl) {
      toast.error(t("Please select a chatbot with RAG URL"));
      return;
    }
    try {
      const ragServiceInstance = createRagServiceInstance(ragUrl);
      const result = await ragServiceInstance.cancelPipeline();
      toast.success(result.message || text.cancelPipelineSuccess);
    } catch (error) {
      console.error("Error cancelling pipeline:", error);
      toast.error(text.cancelPipelineFail);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!ragUrl) {
      toast.error(t("Please select a chatbot with RAG URL"));
      return;
    }
    try {
      setIsUploading(true);
      const ragServiceInstance = createRagServiceInstance(ragUrl);
      await ragServiceInstance.ingestFile(file);
      toast.success(t(text.uploadSuccess, { fileName: file.name }));
      await fetchDocuments();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(text.uploadFail);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleDeleteDocument = (docId: string, fileName: string) => {
    setDocumentToDelete({ id: docId, name: fileName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    if (!ragUrl) {
      toast.error(t("Please select a chatbot with RAG URL"));
      return;
    }

    try {
      const ragServiceInstance = createRagServiceInstance(ragUrl);
      await ragServiceInstance.deleteDocument(documentToDelete.id);
      toast.success(t(text.deleteSuccess, { fileName: documentToDelete.name }));
      // Remove from selected if it was selected
      setSelectedDocIds(prev => prev.filter(id => id !== documentToDelete.id));
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(text.deleteFail);
      throw error;
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDocIds.length === 0) return;
    if (!ragUrl) {
      toast.error(t("Please select a chatbot with RAG URL"));
      return;
    }
    try {
      const ragServiceInstance = createRagServiceInstance(ragUrl);
      await ragServiceInstance.deleteDocuments(selectedDocIds, false, false);
      toast.success(t(text.deleteSelectedSuccess, { count: selectedDocIds.length }));
      setSelectedDocIds([]);
      setDeleteSelectedDialogOpen(false);
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting selected docs:", error);
      toast.error(text.deleteSelectedFail);
      throw error;
    }
  };

  const handleClearDocuments = async () => {
    if (!ragUrl) {
      toast.error(t("Please select a chatbot with RAG URL"));
      return;
    }
    try {
      const ragServiceInstance = createRagServiceInstance(ragUrl);
      const result = await ragServiceInstance.clearDocuments();
      toast.success(result.message || text.clearSuccess);
      setSelectedDocIds([]);
      setSavedSelectedDocIds([]);
      localStorage.removeItem("rag_selected_docs");
      setClearDialogOpen(false);
      await fetchDocuments();
    } catch (error) {
      console.error("Error clearing docs:", error);
      toast.error(text.clearFail);
      throw error;
    }
  };

  const handleToggleSelect = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) 
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedDocuments.map((doc) => doc.id);
    const selectedOnPage = currentPageIds.filter((id) => selectedDocIds.includes(id));

    if (selectedOnPage.length === currentPageIds.length) {
      setSelectedDocIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedDocIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const statusFilteredDocuments = useMemo(() => {
    if (statusFilter === "all") {
      return allDocuments;
    }
    return allDocuments.filter((doc) => doc.status === statusFilter);
  }, [allDocuments, statusFilter]);

  const filteredDocuments = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      return statusFilteredDocuments;
    }

    return statusFilteredDocuments.filter((doc) => {
      const fileName = doc.file_path?.toLowerCase() || "";
      const summary = doc.content_summary?.toLowerCase() || "";
      const id = doc.id.toLowerCase();
      return fileName.includes(keyword) || summary.includes(keyword) || id.includes(keyword);
    });
  }, [searchQuery, statusFilteredDocuments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  const selectedOnCurrentPage = paginatedDocuments.filter((doc) => selectedDocIds.includes(doc.id)).length;

  const getFileName = (filePath: string) => {
    if (!filePath) return text.unknownName;
    const normalized = filePath.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    return parts[parts.length - 1] || filePath;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto space-y-2 p-3 sm:p-4 lg:p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{text.pageTitle}</h1>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={handleScanDocuments}
              disabled={isActionLoading}
            >
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {text.scan}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={handleRetryPipeline}
              disabled={isActionLoading}
            >
              <RotateCcw className="h-4 w-4" />
              {text.retry}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 gap-2 ${pipelineStatus?.busy ? "border-red-400 text-red-600 animate-pulse" : ""}`}
              onClick={() => setPipelineDialogOpen(true)}
            >
              <Activity className="h-4 w-4" />
              {text.pipeline}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={fetchDocuments}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {text.refresh}
            </Button>
            {selectedDocIds.length > 0 ? (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 gap-2"
                onClick={() => setDeleteSelectedDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {text.deleteSelected} ({selectedDocIds.length})
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={() => setClearDialogOpen(true)}
              >
                <Eraser className="h-4 w-4" />
                {text.clearAll}
              </Button>
            )}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              size="sm"
              className="h-8 gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {text.uploading}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {text.upload}
                </>
              )}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xml"
          />
        </div>
      </div>

      <div className="flex w-full justify-center">
        <div className="relative w-full max-w-5xl">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={text.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-1 pt-3">
          <div className="flex flex-wrap items-center justify-center gap-1" dir="ltr">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={statusFilter === tab.key ? "secondary" : "outline"}
                onClick={() => setStatusFilter(tab.key)}
                className={`${tab.tone} ${statusFilter === tab.key ? "shadow-sm" : ""}`}
              >
                {statusTabLabel[tab.key]} ({statusCounts[tab.key]})
              </Button>
            ))}
            {selectedOnCurrentPage > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={() => setSelectedDocIds((prev) => prev.filter((id) => !paginatedDocuments.some((doc) => doc.id === id)))}
              >
                <X className="h-4 w-4" />
                {text.unselectPage}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={() => setSelectedDocIds((prev) => Array.from(new Set([...prev, ...paginatedDocuments.map((doc) => doc.id)])))}
              >
                <CheckSquare className="h-4 w-4" />
                {text.selectPage}
              </Button>
            )}
            <label
              htmlFor="select-all-docs"
              className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                id="select-all-docs"
                checked={selectedOnCurrentPage === paginatedDocuments.length && paginatedDocuments.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 dark:border-slate-600"
              />
              {text.selectAllPage} ({paginatedDocuments.length})
            </label>
            <Button
              onClick={handleSaveSelection}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
              className="h-8 gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {text.saving}
                </>
              ) : (
                <>
                  {hasUnsavedChanges && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  )}
                  {text.saveSelection} ({selectedDocIds.length})
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? text.noResults
                  : text.noDocs}
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-[58vh] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                    <TableRow>
                      <TableHead className="w-12">{text.colSelect}</TableHead>
                      <TableHead>{text.colName}</TableHead>
                      <TableHead>{text.colStatus}</TableHead>
                      <TableHead className="hidden lg:table-cell">{text.colSummary}</TableHead>
                      <TableHead className="hidden sm:table-cell w-24">{text.colChunks}</TableHead>
                      <TableHead className="hidden md:table-cell w-40">{text.colUpdated}</TableHead>
                      <TableHead className="text-right w-24">{text.colActions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={() => handleToggleSelect(doc.id)}
                            className="rounded border-gray-300 dark:border-slate-600"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-[260px]" title={doc.file_path}>
                              {getFileName(doc.file_path)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass[doc.status]}>
                            {statusLabel[doc.status]}
                          </Badge>
                          {doc.error_msg && (
                            <p className="mt-1 max-w-[220px] truncate text-xs text-red-600 dark:text-red-400" title={doc.error_msg}>
                              <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                              {doc.error_msg}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[280px] truncate" title={doc.content_summary}>
                          {doc.content_summary || "-"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{doc.chunks_count ?? "-"}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {new Date(doc.updated_at).toLocaleString(dateLocale)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteDocument(
                                doc.id,
                                getFileName(doc.file_path)
                              )
                            }
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  {text.page} {safeCurrentPage} / {totalPages} • {text.showing} {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} / {filteredDocuments.length}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                  >
                    {text.prev}
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (safeCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (safeCurrentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = safeCurrentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={safeCurrentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                  >
                    {text.next}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={text.deleteDocTitle}
        description={text.deleteDocDesc}
        confirmLabel={text.delete}
        cancelLabel={text.cancel}
        successMessage={t(text.deleteSuccess, { fileName: documentToDelete?.name || "" })}
        errorMessage={text.deleteFail}
      />

      <ConfirmDeleteDialog
        open={deleteSelectedDialogOpen}
        onOpenChange={setDeleteSelectedDialogOpen}
        onConfirm={handleDeleteSelected}
        title={text.deleteSelectedTitle}
        description={t(text.deleteSelectedDesc, { count: selectedDocIds.length })}
        confirmLabel={text.delete}
        cancelLabel={text.cancel}
      />

      <ConfirmDeleteDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        onConfirm={handleClearDocuments}
        title={text.clearTitle}
        description={text.clearDesc}
        confirmLabel={text.clearConfirm}
        cancelLabel={text.cancel}
      />

      <Dialog open={pipelineDialogOpen} onOpenChange={setPipelineDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{text.pipelineTitle}</DialogTitle>
            <DialogDescription>
              {text.pipelineDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm">
                <span>
                  {text.busy}: <strong>{pipelineStatus?.busy ? "true" : "false"}</strong>
                </span>
                <span>
                  {text.pending}: <strong>{pipelineStatus?.request_pending ? "true" : "false"}</strong>
                </span>
                <span>
                  {text.batch}: <strong>{pipelineStatus ? `${pipelineStatus.cur_batch}/${pipelineStatus.batchs}` : "-"}</strong>
                </span>
              </div>

              <Button
                variant="destructive"
                size="sm"
                disabled={!pipelineStatus?.busy || pipelineStatus?.cancellation_requested}
                onClick={handleCancelPipeline}
              >
                {text.cancelPipeline}
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-2 text-sm">
                <p>
                  <strong>{text.job}:</strong> {pipelineStatus?.job_name || "-"}
                </p>
                <p>
                  <strong>{text.startedAt}:</strong>{" "}
                  {pipelineStatus?.job_start
                    ? new Date(pipelineStatus.job_start).toLocaleString(dateLocale)
                    : "-"}
                </p>
                <p>
                  <strong>{text.latestMessage}:</strong> {pipelineStatus?.latest_message || "-"}
                </p>
              </CardContent>
            </Card>

            <div className="rounded-md bg-slate-900 text-slate-100 p-3 text-xs h-56 overflow-y-auto font-mono">
              {pipelineStatus?.history_messages?.length ? (
                pipelineStatus.history_messages.map((line, index) => (
                  <div key={`${line}-${index}`} className="whitespace-pre-wrap break-all">
                    {line}
                  </div>
                ))
              ) : (
                <div>{text.noPipelineLogs}</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPipelineDialogOpen(false)}>
              {text.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
