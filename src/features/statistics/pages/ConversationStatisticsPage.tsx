import { useState } from "react";
import { useConversationStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { MessageSquare, TrendingUp, Users, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});

  const params = {
    startDate: dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : undefined,
    endDate: dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : undefined,
  };

  const { data, isLoading, isError } = useConversationStatistics(params);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Báo Cáo Cuộc Hội Thoại</h1>
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
            Không thể tải dữ liệu thống kê cuộc hội thoại. Vui lòng thử lại sau.
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
          <h1 className="text-3xl font-bold">Báo Cáo Cuộc Hội Thoại</h1>
          <p className="text-muted-foreground">
            Thống kê về cuộc hội thoại và tin nhắn
          </p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.startDate ? (
                  format(dateRange.startDate, "PPP", { locale: vi })
                ) : (
                  <span>Từ ngày</span>
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
                  format(dateRange.endDate, "PPP", { locale: vi })
                ) : (
                  <span>Đến ngày</span>
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
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Tổng Cuộc Hội Thoại"
          value={statsData?.totalConversations || 0}
          icon={MessageSquare}
          description="Tất cả cuộc hội thoại"
        />
        <StatsCard
          title="Tin Nhắn Trung Bình"
          value={statsData?.avgMessagesPerConversation?.toFixed(1) || 0}
          icon={MessageCircle}
          description="Mỗi cuộc hội thoại"
        />
        <StatsCard
          title="Người Dùng Hoạt Động"
          value={statsData?.topUsers?.length || 0}
          icon={Users}
          description="Đang tương tác"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-1">
        {/* Conversation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Xu Hướng Cuộc Hội Thoại</CardTitle>
            <CardDescription>Số lượng cuộc hội thoại và tin nhắn theo thời gian</CardDescription>
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
                  name="Cuộc hội thoại"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalMessages"
                  stroke="#82ca9d"
                  name="Tin nhắn"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>Người Dùng Tích Cực Nhất</CardTitle>
            <CardDescription>Top người dùng có nhiều cuộc hội thoại nhất</CardDescription>
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
                          <p>Cuộc hội thoại: {data.count}</p>
                          <p>Tin nhắn: {data.messages}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Cuộc hội thoại" />
                <Bar dataKey="messages" fill="#82ca9d" name="Tin nhắn" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
