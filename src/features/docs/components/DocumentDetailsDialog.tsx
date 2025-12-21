import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, User } from "lucide-react";
import { docService } from "../api/service";
import { IDoc } from "@/interfaces/doc.interface";
import { useTranslation } from "react-i18next";

interface DocumentDetailsDialogProps {
  docId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentDetailsDialog({
  docId,
  open,
  onOpenChange,
}: DocumentDetailsDialogProps) {
  const { t } = useTranslation();
  const [doc, setDoc] = useState<IDoc | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (docId && open) {
      fetchDocDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, open]);

  const fetchDocDetails = async () => {
    if (!docId) return;

    try {
      setIsLoading(true);
      const response = await docService.getDocumentById(docId);
      if (response.success) {
        setDoc(response.data);
      }
    } catch (error) {
      console.error("Error fetching document details:", error);
    } finally {
      setIsLoading(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("Document Details")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t("Loading...")}
          </div>
        ) : doc ? (
          <div className="space-y-6">
            {/* Name */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{doc.name}</h3>
              {doc.description && (
                <p className="text-sm text-muted-foreground">
                  {doc.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">{t("Tags")}</h4>
                <div className="flex gap-2 flex-wrap">
                  {doc.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* File Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium mb-1">{t("File Type")}</p>
                <p className="text-sm text-muted-foreground uppercase">
                  {doc.fileType || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{t("File Size")}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(doc.fileSize)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{t("Visibility")}</p>
                <Badge variant={doc.isPublic ? "default" : "secondary"}>
                  {doc.isPublic ? t("Public") : t("Private")}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{t("Status")}</p>
                <Badge variant={doc.deleted ? "destructive" : "default"}>
                  {doc.deleted ? t("Deleted") : t("Active")}
                </Badge>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t("Created")}:</span>
                <span className="text-muted-foreground">
                  {new Date(doc.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t("Updated")}:</span>
                <span className="text-muted-foreground">
                  {new Date(doc.updatedAt).toLocaleString()}
                </span>
              </div>
              {doc.createdBy && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t("Created By")}:</span>
                  <span className="text-muted-foreground">{doc.createdBy}</span>
                </div>
              )}
            </div>

            {/* Download Button */}
            {doc.url && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => window.open(doc.url, "_blank")}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t("Download Document")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            {t("Document not found")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
