import { ChatMessage, ContextChunk } from "@/interfaces/rag.interface";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SourceCard } from "./SourceCard";
import { useTranslation } from "react-i18next";

interface MessageBubbleProps {
  message: ChatMessage;
  sources?: ContextChunk[];
  timestamp?: Date;
}

export function MessageBubble({ message, sources, timestamp }: MessageBubbleProps) {
  const { t } = useTranslation();
  const [showSourcesDialog, setShowSourcesDialog] = useState(false);
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-sm max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-2 max-w-[70%]", isUser && "items-end")}>
        <div
          className={cn(
            "px-4 py-2 rounded-lg",
            isUser
              ? "bg-blue-600 text-white rounded-tr-none"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <p className="text-xs text-muted-foreground px-2">
            {timestamp.toLocaleTimeString()}
          </p>
        )}

        {/* Sources */}
        {sources && sources.length > 0 && (
          <>
            <p 
              className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer underline px-2"
              onClick={() => setShowSourcesDialog(true)}
            >
              {t("Sources")} ({sources.length}):
            </p>

            {/* Sources Dialog */}
            <Dialog open={showSourcesDialog} onOpenChange={setShowSourcesDialog}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {t("Sources")} ({sources.length})
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {sources.map((source, idx) => (
                    <SourceCard key={idx} source={source} index={idx} />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
