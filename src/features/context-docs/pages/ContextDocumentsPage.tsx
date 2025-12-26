import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, Trash2, FileText, Loader2, Search } from "lucide-react";
import { ragService } from "@/features/chat/api/ragService";
import { IngestedDocument } from "@/interfaces/rag.interface";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

export function ContextDocumentsPage() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [savedSelectedDocIds, setSavedSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3); // Giảm xuống 3 để test pagination
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    loadSavedSelection();
  }, []);

  const loadSavedSelection = () => {
    // Load from localStorage
    const saved = localStorage.getItem('rag_selected_docs');
    if (saved) {
      const ids = JSON.parse(saved);
      setSelectedDocIds(ids);
      setSavedSelectedDocIds(ids);
    }
  };

  const handleSaveSelection = async () => {
    try {
      setIsSaving(true);
      // Save to localStorage (or call API if needed)
      localStorage.setItem('rag_selected_docs', JSON.stringify(selectedDocIds));
      setSavedSelectedDocIds([...selectedDocIds]);
      toast.success(`Đã lưu ${selectedDocIds.length} tài liệu được chọn!`);
    } catch (error) {
      console.error("Error saving selection:", error);
      toast.error("Không thể lưu lựa chọn. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = JSON.stringify(selectedDocIds.sort()) !== JSON.stringify(savedSelectedDocIds.sort());

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await ragService.listIngestedDocuments();
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Không thể tải danh sách tài liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      await ragService.ingestFile(file);
      toast.success(`Đã tải lên tài liệu "${file.name}" thành công!`);
      await fetchDocuments();
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
      e.target.value = "";
    }
  };

  const handleDeleteDocument = (docId: string, fileName: string) => {
    setDocumentToDelete({ id: docId, name: fileName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      await ragService.deleteDocument(documentToDelete.id);
      toast.success(`Đã xóa tài liệu "${documentToDelete.name}" thành công!`);
      // Remove from selected if it was selected
      setSelectedDocIds(prev => prev.filter(id => id !== documentToDelete.id));
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Không thể xóa tài liệu. Vui lòng thử lại.");
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleToggleSelect = (docId: string) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocIds.length === paginatedDocuments.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(paginatedDocuments.map(doc => doc.doc_id));
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.doc_metadata?.file_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Group documents by file name
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const fileName = doc.doc_metadata?.file_name || "Không có tên";
    if (!acc[fileName]) {
      acc[fileName] = [];
    }
    acc[fileName].push(doc);
    return acc;
  }, {} as Record<string, IngestedDocument[]>);

  // Convert to array and take first document of each group
  const uniqueDocuments = Object.values(groupedDocuments).map(group => ({
    ...group[0], // Take first document as representative
    _groupCount: group.length, // Store count for display
    _groupIds: group.map(d => d.doc_id), // Store all IDs in group
  }));

  // Pagination
  const totalPages = Math.ceil(uniqueDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = uniqueDocuments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tài liệu ngữ cảnh
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tài liệu cho RAG Chat
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải lên...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Tải lên tài liệu
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
          accept=".pdf,.doc,.docx,.txt"
        />
      </div>

      {/* Stats Cards + Search */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số tài liệu
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              Đã được tải lên hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đã chọn
            </CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {selectedDocIds.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tài liệu được sử dụng cho RAG
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tìm kiếm
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Tìm theo tên file..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="h-9"
            />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Không tìm thấy tài liệu nào"
                  : "Chưa có tài liệu nào. Hãy tải lên tài liệu đầu tiên!"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all-docs"
                    checked={selectedDocIds.length === paginatedDocuments.length && paginatedDocuments.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="select-all-docs" className="text-sm font-medium cursor-pointer">
                    Chọn tất cả trang này
                  </label>
                </div>
                <Button
                  onClick={handleSaveSelection}
                  disabled={isSaving || !hasUnsavedChanges}
                  size="sm"
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      {hasUnsavedChanges && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      )}
                      Lưu lựa chọn ({selectedDocIds.length})
                    </>
                  )}
                </Button>
              </div>
              
              {/* Table with fixed height - fits 3 items */}
              <div className="h-[188px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-12">Chọn</TableHead>
                      <TableHead>Tên tài liệu</TableHead>
                      <TableHead className="text-right w-24">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDocuments.map((doc: any) => (
                      <TableRow key={doc.doc_id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.doc_id)}
                            onChange={() => handleToggleSelect(doc.doc_id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="truncate" title={doc.doc_metadata?.file_name}>
                              {doc.doc_metadata?.file_name || "Không có tên"}
                            </span>
                            {doc._groupCount > 1 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                x{doc._groupCount}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteDocument(
                                doc.doc_id,
                                doc.doc_metadata?.file_name || doc.doc_id
                              )
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination - Always visible */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages} • Hiển thị {startIndex + 1}-{Math.min(endIndex, uniqueDocuments.length)} / {uniqueDocuments.length}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Trước
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sau →
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
      />
    </div>
  );
}
