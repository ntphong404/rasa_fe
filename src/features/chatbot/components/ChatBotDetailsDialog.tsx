"use client";

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChatBot } from "../api/dto/ChatBotResponse";

interface ChatBotDetailsDialogProps {
  chatBot: ChatBot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatBotDetailsDialog({
  chatBot,
  open,
  onOpenChange,
}: ChatBotDetailsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{t("ChatBot Details")}</DialogTitle>
          <DialogDescription>
            {t("Details for chatbot")} {chatBot?.name}
          </DialogDescription>
        </DialogHeader>
        {chatBot ? (
          <div className="space-y-4">
            <div>
              <strong>{t("Name")}:</strong> {chatBot.name}
            </div>
            <div>
              <strong>{t("IP Address")}:</strong> {chatBot.ip}
            </div>
            <div>
              <strong>{t("Rasa Port")}:</strong> {chatBot.rasaPort}
            </div>
            <div>
              <strong>{t("Flask Port")}:</strong> {chatBot.flaskPort}
            </div>
            {chatBot.roles && chatBot.roles.length > 0 && (
              <div>
                <strong>{t("Roles")}:</strong>{" "}
                <span className="text-sm">
                  {chatBot.roles.map((role: string | { _id: string; name?: string }) => 
                    typeof role === 'string' ? role : role.name || role._id
                  ).join(", ")}
                </span>
              </div>
            )}
            <div>
              <strong>{t("Created At")}:</strong>{" "}
              {new Date(chatBot.createdAt).toLocaleString()}
            </div>
            <div>
              <strong>{t("Updated At")}:</strong>{" "}
              {new Date(chatBot.updatedAt).toLocaleString()}
            </div>
            {chatBot.deletedAt && (
              <div>
                <strong>{t("Deleted At")}:</strong>{" "}
                {new Date(chatBot.deletedAt).toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {t("No chatbot selected")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}