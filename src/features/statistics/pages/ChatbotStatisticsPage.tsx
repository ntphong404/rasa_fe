import { useMemo, useState } from "react";
import { useChatbotStatistics, useResponseFeedbackStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { Bot, Server, ThumbsDown, ThumbsUp, Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const ChatbotStatisticsPage = () => {
  const [selectedBotId, setSelectedBotId] = useState<string>("all");
  const chatbots = useChatbotStatistics();
  const feedback = useResponseFeedbackStatistics({
    limit: 10,
    botId: selectedBotId === "all" ? undefined : selectedBotId,
  });

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
  const feedbackData = feedback.data?.data;

  const topLikedChartData = useMemo(
    () =>
      (feedbackData?.topLiked || []).map((item) => ({
        name: item.name?.replace("utter_", "") || "N/A",
        likes: item.likeCount,
      })),
    [feedbackData?.topLiked]
  );

  const topDislikedChartData = useMemo(
    () =>
      (feedbackData?.topDisliked || []).map((item) => ({
        name: item.name?.replace("utter_", "") || "N/A",
        dislikes: item.dislikeCount,
      })),
    [feedbackData?.topDisliked]
  );

  const selectedBotName = useMemo(() => {
    if (selectedBotId === "all") return "Tất cả chatbot";
    return data?.chatbots?.find((bot) => bot._id === selectedBotId)?.name || "Chatbot đã chọn";
  }, [data?.chatbots, selectedBotId]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo Cáo Chatbot</h1>
        <p className="text-muted-foreground">
          Thông tin về các chatbot trong hệ thống
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phản Hồi Người Dùng Theo Response</CardTitle>
          <CardDescription>
            Top response được thích/không thích nhiều nhất theo chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full md:w-80">
            <p className="text-sm text-muted-foreground mb-2">Bộ lọc chatbot</p>
            <Select value={selectedBotId} onValueChange={setSelectedBotId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chatbot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chatbot</SelectItem>
                {data?.chatbots?.map((bot) => (
                  <SelectItem key={bot._id} value={bot._id}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {feedback.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : feedback.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Không thể tải dữ liệu phản hồi like/dislike. Vui lòng thử lại sau.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                  title="Tổng lượt thích"
                  value={feedbackData?.totalLikes || 0}
                  icon={ThumbsUp}
                  description={selectedBotName}
                />
                <StatsCard
                  title="Tổng lượt không thích"
                  value={feedbackData?.totalDislikes || 0}
                  icon={ThumbsDown}
                  description={selectedBotName}
                />
                <StatsCard
                  title="Tổng response có feedback"
                  value={feedbackData?.totalResponses || 0}
                  icon={Bot}
                  description="Response đã có tương tác"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Liked Responses</CardTitle>
                    <CardDescription>Phản hồi được người dùng thích nhiều nhất</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topLikedChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={topLikedChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="likes" fill="#10b981" name="Likes" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Disliked Responses</CardTitle>
                    <CardDescription>Phản hồi bị không thích nhiều nhất</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topDislikedChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={topDislikedChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="dislikes" fill="#ef4444" name="Dislikes" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
