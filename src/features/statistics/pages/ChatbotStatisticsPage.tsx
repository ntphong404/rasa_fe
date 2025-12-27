import { useChatbotStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { Bot, Server, Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const ChatbotStatisticsPage = () => {
  const chatbots = useChatbotStatistics();

  if (chatbots.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Báo Cáo Chatbot</h1>
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
            Không thể tải dữ liệu thống kê chatbot. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = chatbots.data?.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo Cáo Chatbot</h1>
        <p className="text-muted-foreground">
          Thông tin về các chatbot trong hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Tổng Chatbot"
          value={data?.totalChatbots || 0}
          icon={Bot}
          description="Chatbot trong hệ thống"
        />
        <StatsCard
          title="Rasa Servers"
          value={data?.chatbots?.filter(cb => cb.rasaPort).length || 0}
          icon={Server}
          description="Server Rasa đang chạy"
        />
        <StatsCard
          title="Action Servers"
          value={data?.chatbots?.filter(cb => cb.flaskPort).length || 0}
          icon={Wifi}
          description="Action server đang chạy"
        />
      </div>

      {/* Chatbot List */}
      <Card>
        <CardHeader>
          <CardTitle>Chi Tiết Chatbot</CardTitle>
          <CardDescription>Danh sách và thông tin chi tiết các chatbot</CardDescription>
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
                          <p className="font-medium">{chatbot.flaskPort}</p>
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
                Không có chatbot nào trong hệ thống
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
