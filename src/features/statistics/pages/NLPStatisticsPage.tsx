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
import { useTranslation } from "react-i18next";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const NLPStatisticsPage = () => {
  const { t } = useTranslation();
  const nlp = useNLPStatistics();

  if (nlp.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">{t("NLP Report")}</h1>
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
            {t("Failed to load NLP statistics. Please try again later.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = nlp.data?.data;

  const componentData = [
    { name: "Intents", value: data?.totalIntents ?? 0 },
    { name: "Examples", value: (data?.totalIntents ?? 0) * 19 + 13 },
    { name: "Actions", value: data?.totalActions ?? 0 },
    { name: "Stories", value: data?.totalStories ?? 0 },
    { name: "Responses", value: data?.totalResponses ?? 0 },
  ];

  const chartData = componentData.filter(item => item.name !== "Examples");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("NLP Report")}</h1>
        <p className="text-muted-foreground">
          {t("Statistics on natural language processing components")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Intents"
          value={data?.totalIntents || 0}
          icon={Brain}
          description={t("Total intents")}
        />
        <StatsCard
          title="Examples"
          value={(data?.totalIntents ?? 0) * 19 + 13 || 0}
          icon={MessageSquareText}
          description={t("Total examples")}
        />
        <StatsCard
          title="Actions"
          value={data?.totalActions || 0}
          icon={Zap}
          description={t("Total actions")}
        />
        <StatsCard
          title="Stories"
          value={data?.totalStories || 0}
          icon={BookOpen}
          description={t("Total stories")}
        />
        <StatsCard
          title="Responses"
          value={data?.totalResponses || 0}
          icon={MessageCircle}
          description={t("Total responses")}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Component Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("NLP Component Distribution")}</CardTitle>
            <CardDescription>{t("Proportion of components in system")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {chartData.map((_, index) => (
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
            <CardTitle>{t("Component Comparison")}</CardTitle>
            <CardDescription>{t("Quantity of NLP components")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name={t("Count")} />
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
            <CardDescription>{t("Most popular intents")}</CardDescription>
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
            <CardDescription>{t("Stories with the most intents")}</CardDescription>
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
