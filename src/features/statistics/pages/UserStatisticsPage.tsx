import { useState } from "react";
import { useUserStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { ExportReportDialog } from "../components/ExportReportDialog";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, User, FileDown } from "lucide-react";
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
  LineChart,
  Line,
} from "recharts";
import { useTranslation } from "react-i18next";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const UserStatisticsPage = () => {
  const { t } = useTranslation();
  const users = useUserStatistics();
  const [exportOpen, setExportOpen] = useState(false);

  if (users.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">{t("User Report")}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (users.isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {t("Failed to load user statistics. Please try again later.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = users.data?.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t("User Report")}</h1>
          <p className="text-muted-foreground">
            {t("Overview of users in the system")}
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
        defaultSections={['users']}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("Total Users")}
          value={data?.totalUsers || 0}
          icon={Users}
          description={t("All users")}
        />
        <StatsCard
          title={t("Active Users")}
          value={data?.activeUsers || 0}
          icon={UserCheck}
          description={t("Active")}
        />
        <StatsCard
          title={t("Banned Users")}
          value={data?.bannedUsers || 0}
          icon={UserX}
          description={t("Banned")}
        />
        <StatsCard
          title={t("Inactive Users")}
          value={data?.inactiveUsers || 0}
          icon={User}
          description={t("Not activated")}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Gender Distribution")}</CardTitle>
            <CardDescription>{t("Number of users by gender")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.usersByGender || []}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {(data?.usersByGender || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Creation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Registration Trend")}</CardTitle>
            <CardDescription>{t("Number of new users over time")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.userCreationTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  name={t("New users")}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t("User Status Distribution")}</CardTitle>
          <CardDescription>{t("Comparison of user status")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: t("Active"), value: data?.activeUsers || 0 },
                { name: t("Banned"), value: data?.bannedUsers || 0 },
                { name: t("Inactive"), value: data?.inactiveUsers || 0 },
              ]}
            >
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
  );
};
