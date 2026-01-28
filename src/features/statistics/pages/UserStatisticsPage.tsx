import { useUserStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { Users, UserCheck, UserX, User } from "lucide-react";
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const UserStatisticsPage = () => {
  const users = useUserStatistics();

  if (users.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Báo Cáo Người Dùng</h1>
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
            Không thể tải dữ liệu thống kê người dùng. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = users.data?.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo Cáo Người Dùng</h1>
        <p className="text-muted-foreground">
          Tổng quan về người dùng trong hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng Người Dùng"
          value={data?.totalUsers || 0}
          icon={Users}
          description="Tất cả người dùng"
        />
        <StatsCard
          title="Người Dùng Hoạt Động"
          value={data?.activeUsers || 0}
          icon={UserCheck}
          description="Đang hoạt động"
        />
        <StatsCard
          title="Người Dùng Bị Cấm"
          value={data?.bannedUsers || 0}
          icon={UserX}
          description="Đã bị cấm"
        />
        <StatsCard
          title="Người Dùng Không Hoạt Động"
          value={data?.inactiveUsers || 0}
          icon={User}
          description="Chưa kích hoạt"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Bố Theo Giới Tính</CardTitle>
            <CardDescription>Số lượng người dùng theo giới tính</CardDescription>
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
            <CardTitle>Xu Hướng Đăng Ký</CardTitle>
            <CardDescription>Số lượng người dùng mới theo thời gian</CardDescription>
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
                  name="Người dùng mới"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Phân Bố Trạng Thái Người Dùng</CardTitle>
          <CardDescription>So sánh trạng thái người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: "Hoạt động", value: data?.activeUsers || 0 },
                { name: "Bị cấm", value: data?.bannedUsers || 0 },
                { name: "Không hoạt động", value: data?.inactiveUsers || 0 },
              ]}
            >
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
  );
};
