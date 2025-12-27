import { useNLPStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { Brain, MessageSquareText, Zap, BookOpen, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const NLPStatisticsPage = () => {
  const nlp = useNLPStatistics();

  if (nlp.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Báo Cáo NLP</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (nlp.isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Không thể tải dữ liệu thống kê NLP. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = nlp.data?.data;

  const componentData = [
    { name: "Intents", value: data?.totalIntents || 0 },
    { name: "Entities", value: data?.totalEntities || 0 },
    { name: "Actions", value: data?.totalActions || 0 },
    { name: "Stories", value: data?.totalStories || 0 },
    { name: "Responses", value: data?.totalResponses || 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo Cáo NLP</h1>
        <p className="text-muted-foreground">
          Thống kê về các thành phần xử lý ngôn ngữ tự nhiên
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Intents"
          value={data?.totalIntents || 0}
          icon={Brain}
          description="Tổng số ý định"
        />
        <StatsCard
          title="Entities"
          value={data?.totalEntities || 0}
          icon={MessageSquareText}
          description="Tổng số thực thể"
        />
        <StatsCard
          title="Actions"
          value={data?.totalActions || 0}
          icon={Zap}
          description="Tổng số hành động"
        />
        <StatsCard
          title="Stories"
          value={data?.totalStories || 0}
          icon={BookOpen}
          description="Tổng số câu chuyện"
        />
        <StatsCard
          title="Responses"
          value={data?.totalResponses || 0}
          icon={MessageCircle}
          description="Tổng số phản hồi"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Component Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Bố Thành Phần NLP</CardTitle>
            <CardDescription>Tỷ lệ các thành phần trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={componentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {componentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Component Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>So Sánh Thành Phần</CardTitle>
            <CardDescription>Số lượng các thành phần NLP</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={componentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Intents */}
      {data?.nlpComponents?.intents?.topIntents && (
        <Card>
          <CardHeader>
            <CardTitle>Top Intents</CardTitle>
            <CardDescription>Các intent phổ biến nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.nlpComponents.intents.topIntents.slice(0, 10).map((intent, index) => (
                <div
                  key={intent._id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{intent._id}</p>
                      <p className="text-sm text-muted-foreground">
                        {intent.entities?.length || 0} entities
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Stories */}
      {data?.nlpComponents?.stories?.topStories && (
        <Card>
          <CardHeader>
            <CardTitle>Top Stories</CardTitle>
            <CardDescription>Các story có nhiều intent nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.nlpComponents.stories.topStories.slice(0, 10).map((story, index) => (
                <div
                  key={story._id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{story._id}</p>
                      <p className="text-sm text-muted-foreground">
                        {story.intentsCount} intents
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
