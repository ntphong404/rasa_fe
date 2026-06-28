import { useState } from "react";
import { useConversationStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { ExportReportDialog } from "../components/ExportReportDialog";
import { MessageSquare, TrendingUp, Users, MessageCircle, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useChatbotStore } from "@/store/chatbot";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export const ConversationStatisticsPage = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "vi" ? vi : enUS;

  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [exportOpen, setExportOpen] = useState(false);

  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const scopedBotId = selectedBotId && selectedBotId !== 'global' ? selectedBotId : undefined;

  const params = {
    startDate: dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : undefined,
    endDate: dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : undefined,
    botId: scopedBotId,
  };

  const { data, isLoading, isError } = useConversationStatistics(params);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">{t("Conversation Report")}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {t("Failed to load conversation statistics. Please try again later.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statsData = data?.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("Conversation Report")}</h1>
          <p className="text-muted-foreground">
            {t("Statistics on conversations and messages")}
          </p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.startDate ? (
                  format(dateRange.startDate, "PPP", { locale: dateLocale })
                ) : (
                  <span>{t("From date")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.startDate}
                onSelect={(date) => setDateRange({ ...dateRange, startDate: date })}
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.endDate ? (
                  format(dateRange.endDate, "PPP", { locale: dateLocale })
                ) : (
                  <span>{t("To date")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.endDate}
                onSelect={(date) => setDateRange({ ...dateRange, endDate: date })}
              />
            </PopoverContent>
          </Popover>
          {(dateRange.startDate || dateRange.endDate) && (
            <Button
              variant="ghost"
              onClick={() => setDateRange({})}
            >
              {t("Clear filters")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setExportOpen(true)}
            className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
          >
            <FileDown className="h-4 w-4" />
            Xuất Excel
          </Button>
        </div>
      </div>
      <ExportReportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        defaultSections={['conversations']}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title={t("Total Conversations")}
          value={statsData?.totalConversations || 0}
          icon={MessageSquare}
          description={t("All conversations")}
        />
        <StatsCard
          title={t("Average Messages")}
          value={statsData?.avgMessagesPerConversation?.toFixed(1) || 0}
          icon={MessageCircle}
          description={t("Per conversation")}
        />
        <StatsCard
          title={t("Active Users")}
          value={statsData?.topUsers?.length || 0}
          icon={Users}
          description={t("Currently interacting")}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-1">
        {/* Conversation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Conversation Trend")}</CardTitle>
            <CardDescription>{t("Number of conversations and messages over time")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statsData?.conversationTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  name={t("Conversations")}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalMessages"
                  stroke="#82ca9d"
                  name={t("Messages")}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Most Active Users")}</CardTitle>
            <CardDescription>{t("Top users with the most conversations")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statsData?.topUsers?.slice(0, 10) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="user[0].email"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border p-2 rounded shadow">
                          <p className="font-semibold">
                            {data.user?.[0]?.firstName} {data.user?.[0]?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {data.user?.[0]?.email}
                          </p>
                          <p>{t("Conversations")}: {data.count}</p>
                          <p>{t("Messages")}: {data.messages}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name={t("Conversations")} />
                <Bar dataKey="messages" fill="#82ca9d" name={t("Messages")} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
