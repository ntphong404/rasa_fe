import { useState } from "react";
import { useChatbotStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { ExportReportDialog } from "../components/ExportReportDialog";
import { Button } from "@/components/ui/button";
import { Bot, Server, Wifi, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useChatbotStore } from "@/store/chatbot";

export const ChatbotStatisticsPage = () => {
  const { t } = useTranslation();
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const scopedBotId = selectedBotId && selectedBotId !== 'global' ? selectedBotId : undefined;
  const chatbots = useChatbotStatistics({ botId: scopedBotId });
  const [exportOpen, setExportOpen] = useState(false);

  const data = chatbots.data?.data;

  if (chatbots.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">{t("Chatbot Report")}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (chatbots.isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {t("Failed to load chatbot statistics. Please try again later.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t("Chatbot Report")}</h1>
          <p className="text-muted-foreground">
            {t("Information about chatbots in the system")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setExportOpen(true)}
          className="gap-2 border-green-600 text-green-700 hover:bg-green-50 shrink-0"
        >
          <FileDown className="h-4 w-4" />
          Xuất Excel
        </Button>
      </div>
      <ExportReportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        defaultSections={['chatbots']}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title={t("Total Chatbots")}
          value={data?.totalChatbots || 0}
          icon={Bot}
          description={t("Chatbots in system")}
        />
        <StatsCard
          title="Rasa Servers"
          value={data?.chatbots?.filter(cb => cb.rasaPort).length || 0}
          icon={Server}
          description={t("Running Rasa servers")}
        />
        <StatsCard
          title="Action Servers"
          value={data?.chatbots?.filter(cb => cb.flaskUrl).length || 0}
          icon={Wifi}
          description={t("Running Action servers")}
        />
      </div>

      {/* Chatbot List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Chatbot Details")}</CardTitle>
          <CardDescription>{t("List and details of chatbots")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.chatbots?.map((chatbot) => (
              <Card key={chatbot._id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{chatbot.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">IP Address</p>
                          <p className="font-medium">{chatbot.ip}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rasa Port</p>
                          <p className="font-medium">{chatbot.rasaPort}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Flask Port</p>
                          <p className="font-medium">{chatbot.flaskUrl}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Roles</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {chatbot.roles?.map((role) => (
                              <Badge key={role._id} variant="secondary">
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!data?.chatbots || data.chatbots.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                {t("No chatbots in the system")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
