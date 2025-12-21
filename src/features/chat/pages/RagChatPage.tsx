import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, MessageSquare, Upload, X, ArrowLeft, Trash2 } from "lucide-react";
import { MessageBubble } from "../components/MessageBubble";
import { ragService } from "../api/ragService";
import {
  ChatMessage,
  ContextChunk,
  IngestedDocument,
} from "@/interfaces/rag.interface";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  sources?: ContextChunk[];
}

export function RagChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useContext, setUseContext] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [availableDocs, setAvailableDocs] = useState<IngestedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, name: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch available documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const response = await ragService.listIngestedDocuments();
      setAvailableDocs(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error(t("Failed to load documents"));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await ragService.chatCompletion({
        messages: messages
          .map((m) => ({ role: m.role, content: m.content }))
          .concat({ role: "user", content: userMessage.content }),
        use_context: useContext,
        include_sources: useContext,
        stream: false,
        context_filter:
          selectedDocs.length > 0 ? { docs_ids: selectedDocs } : undefined,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.choices[0].message.content,
        timestamp: new Date(),
        sources: response.choices[0].sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("Failed to send message. Please try again."));
      
      // Remove user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      await ragService.ingestFile(file);
      toast.success(`Đã tải lên tài liệu "${file.name}" thành công!`);
      await fetchDocuments(); // Refresh document list
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Không thể tải lên tài liệu. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
      e.target.value = ""; // Reset input
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    // Get document name for confirmation message
    const doc = availableDocs.find(d => d.doc_id === docId);
    const fileName = doc?.doc_metadata?.file_name || docId;
    
    // Open confirmation dialog
    setDocumentToDelete({ id: docId, name: fileName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      await ragService.deleteDocument(documentToDelete.id);
      toast.success(`Đã xóa tài liệu "${documentToDelete.name}" thành công!`);
      await fetchDocuments(); // Refresh list
      // Clear selection if deleted doc was selected
      if (selectedDocs.includes(documentToDelete.id)) {
        setSelectedDocs([]);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Không thể xóa tài liệu. Vui lòng thử lại.");
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleBackToNormalChat = () => {
    navigate('/home_chat_demo');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-full mx-auto">
      {/* Left Sidebar - File Management */}
      <div className="w-80 border-r flex flex-col bg-muted/30">
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" onClick={handleBackToNormalChat} className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("Back")}
            </Button>
          </div>
          <h2 className="text-lg font-bold">{t("Document Management")}</h2>
        </div>

        {/* File Upload Area */}
        <div className="p-4 border-b">
          <Label className="text-xs font-semibold mb-2 block">{t("Upload Documents")}</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-medium text-blue-600 hover:text-blue-700">
              {isUploading ? t("Uploading...") : t("Click or drag file")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("PDF, DOC, TXT")}
            </p>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-4">
          <Label className="text-xs font-semibold mb-2 block">
            {t("Uploaded Documents")} ({availableDocs.length})
          </Label>
          {availableDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">{t("No documents yet")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableDocs.map((doc) => (
                <div
                  key={doc.doc_id}
                  className="flex items-center justify-between p-2 bg-background rounded border hover:border-blue-300 transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Upload className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs truncate" title={doc.doc_metadata?.file_name}>
                      {doc.doc_metadata?.file_name || doc.doc_id}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.doc_id)}
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">{t("RAG Chat")}</h1>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center space-x-2">
              <Switch
                id="use-context"
                checked={useContext}
                onCheckedChange={setUseContext}
              />
              <Label htmlFor="use-context" className="cursor-pointer text-sm">
                {t("Use Document Context")}
              </Label>
            </div>

            {useContext && availableDocs.length > 0 && (
              <div className="flex-1 min-w-[200px] max-w-xs">
                <Select
                  value={selectedDocs[0] || "all"}
                  onValueChange={(value) =>
                    setSelectedDocs(value === "all" ? [] : [value])
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("All documents")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All documents")}</SelectItem>
                    {availableDocs.map((doc) => (
                      <SelectItem key={doc.doc_id} value={doc.doc_id}>
                        {doc.doc_metadata.file_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg">{t("No messages yet")}</p>
            <p className="text-sm">{t("Start a conversation with AI")}</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              sources={message.sources}
              timestamp={message.timestamp}
            />
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">{t("AI is typing...")}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-background">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("Type your message... (Shift+Enter for new line)")}
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("Press Enter to send, Shift+Enter for new line")}
          </p>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
