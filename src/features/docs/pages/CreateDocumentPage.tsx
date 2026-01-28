import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, X } from "lucide-react";
import { docService } from "../api/service";
import { toast } from "sonner";

export function CreateDocumentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Allowed file extensions according to backend
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

  const validateFileType = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const isValid = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      toast.error(
        t("Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX are allowed")
      );
    }
    
    return isValid;
  };

  const predefinedTags = [
    "Học vụ",
    "Tài chính",
    "Nhân sự",
    "Nghiên cứu",
    "Hợp đồng",
    "Quy định",
    "Thông báo",
    "Biểu mẫu",
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFileType(selectedFile)) {
        setFile(selectedFile);
      } else {
        // Clear the input
        e.target.value = "";
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
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
      const droppedFile = e.dataTransfer.files[0];
      if (validateFileType(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleUploadAreaClick = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("Please enter document name"));
      return;
    }

    if (!file) {
      toast.error(t("Please select a file"));
      return;
    }

    try {
      setIsSubmitting(true);

      await docService.createDocument({
        name: name.trim(),
        description: description.trim(),
        tags: selectedTags,
        isPublic,
        file,
      });

      toast.success(t("Document created successfully"));
      navigate("/docs");
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error(t("Failed to create document"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl p-3">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/docs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("Back")}
        </Button>
        <h1 className="text-3xl font-bold">{t("Create New Document")}</h1>
      </div>

      <div className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">{t("File")} *</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors min-h-[140px] flex items-center justify-center ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!file ? handleUploadAreaClick : undefined}
          >
            {!file ? (
              <div>
                <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-blue-600 hover:text-blue-700 font-medium mb-1">
                  {t("Click to upload")}
                </p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  {t("PDF, DOC, DOCX, TXT, or other document formats")}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg w-full">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="doc-name">{t("Document Name")} *</Label>
          <Input
            id="doc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("e.g., Contract Agreement 2024")}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="doc-desc">{t("Description")}</Label>
          <Textarea
            id="doc-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("Describe what this document is about")}
            rows={4}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>{t("Tags")}</Label>
          <div className="space-y-3">
            {/* Predefined Tags */}
            <div className="flex flex-wrap gap-2">
              {predefinedTags.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag)}
                  className="h-8"
                >
                  {tag}
                </Button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <Input
                placeholder={t("Other - Enter custom tag")}
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
              >
                {t("Add")}
              </Button>
            </div>

            {/* Selected Tags Display - Fixed Height */}
            <div className="min-h-[60px]">
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Is Public */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="doc-public"
            checked={isPublic}
            onCheckedChange={(checked) => setIsPublic(checked as boolean)}
          />
          <label
            htmlFor="doc-public"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t("Make this document public")}
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => navigate("/docs")}
            disabled={isSubmitting}
          >
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? t("Creating...") : t("Create Document")}
          </Button>
        </div>
      </div>
    </div>
  );
}
