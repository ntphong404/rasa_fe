import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { ContextChunk } from "@/interfaces/rag.interface";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SourceCardProps {
  source: ContextChunk;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card 
        className="mb-2 cursor-pointer hover:border-blue-300 transition-colors" 
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {source.document.doc_metadata.file_name}
                </p>
                {source.document.doc_metadata.page_label && (
                  <p className="text-xs text-muted-foreground">
                    {t("Page")} {source.document.doc_metadata.page_label}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {source.score.toFixed(3)}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {source.text}
          </p>
        </CardContent>
      </Card>

      {/* Source Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {source.document.doc_metadata.file_name}
            </DialogTitle>
            <DialogDescription>
              {source.document.doc_metadata.page_label && (
                <span>{t("Page")} {source.document.doc_metadata.page_label} • </span>
              )}
              {t("Relevance Score")}: {source.score.toFixed(3)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Previous Context */}
            {source.previous_texts && source.previous_texts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                  {t("Previous context")}:
                </h4>
                <div className="space-y-2">
                  {source.previous_texts.map((text, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground pl-3 border-l-2 border-gray-300">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div>
              <h4 className="text-sm font-semibold mb-2">{t("Matched Content")}:</h4>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{source.text}</p>
              </div>
            </div>

            {/* Next Context */}
            {source.next_texts && source.next_texts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                  {t("Next context")}:
                </h4>
                <div className="space-y-2">
                  {source.next_texts.map((text, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground pl-3 border-l-2 border-gray-300">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
