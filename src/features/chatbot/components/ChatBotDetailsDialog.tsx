"use client";

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bot, Network, Calendar, AlertCircle, Users } from "lucide-react";
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b px-6 py-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-cyan-900">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Bot className="h-6 w-6 text-cyan-600" />
              </div>
              {t("ChatBot Details")}
            </DialogTitle>
          </DialogHeader>
        </div>

        {chatBot ? (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              {/* Name & Status Card */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">
                      {t("ChatBot Name")}
                    </h3>
                    <p className="text-lg font-bold text-cyan-900">{chatBot.name}</p>
                  </div>
                  {chatBot.deletedAt ? (
                    <Badge variant="destructive" className="h-6">{t("Deleted")}</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 h-6">{t("Active")}</Badge>
                  )}
                </div>
              </div>

              {/* Network Configuration Card */}
              <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <Network className="h-4 w-4 text-blue-600" />
                  {t("Network Configuration")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("IP Address")}</p>
                    <p className="text-sm font-medium text-gray-900">{chatBot.ip}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("Rasa Port")}</p>
                    <p className="text-sm font-medium text-gray-900">{chatBot.rasaPort}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("Flask Port")}</p>
                    <p className="text-sm font-medium text-gray-900">{chatBot.flaskPort}</p>
                  </div>
                </div>
              </div>

              {/* Roles Card */}
              {chatBot.roles && chatBot.roles.length > 0 && (
                <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                    <Users className="h-4 w-4 text-purple-600" />
                    {t("Roles")}
                    <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {chatBot.roles.length}
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {chatBot.roles.map((role: string | { _id: string; name?: string }, index: number) => {
                      const roleName = typeof role === 'string' ? role : role.name || role._id;
                      return (
                        <Badge key={index} className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300">
                          {roleName}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wide">
                      {t("Created At")}
                    </h3>
                  </div>
                  <p className="text-sm font-semibold text-green-900">
                    {new Date(chatBot.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wide">
                      {t("Updated At")}
                    </h3>
                  </div>
                  <p className="text-sm font-semibold text-blue-900">
                    {new Date(chatBot.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Deleted Status */}
              {chatBot.deletedAt && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <Badge variant="destructive" className="text-sm font-bold">{t("Deleted")}</Badge>
                    <span className="text-sm text-red-700 font-semibold">
                      {t("on")} {new Date(chatBot.deletedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t("No chatbot selected")}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}