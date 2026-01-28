import { useDocumentStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { FileText, File, Lock, Globe } from "lucide-react";
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D'];

export const DocumentStatisticsPage = () => {
  const documents = useDocumentStatistics();

  if (documents.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Báo Cáo Tài Liệu</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (documents.isError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Không thể tải dữ liệu thống kê tài liệu. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = documents.data?.data;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const fileSizeData = [
    { name: "Nhỏ (< 1MB)", value: data?.fileSizeStats?.smallFiles || 0 },
    { name: "Trung bình (1-10MB)", value: data?.fileSizeStats?.mediumFiles || 0 },
    { name: "Lớn (>= 10MB)", value: data?.fileSizeStats?.largeFiles || 0 },
  ];

  const accessData = [
    { name: "Công khai", value: data?.accessStats?.public || 0 },
    { name: "Riêng tư", value: data?.accessStats?.private || 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo Cáo Tài Liệu</h1>
        <p className="text-muted-foreground">
          Thống kê về tài liệu trong hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng Tài Liệu"
          value={data?.totalDocs || 0}
          icon={FileText}
          description="Tất cả tài liệu"
        />
        <StatsCard
          title="Tài Liệu Công Khai"
          value={data?.accessStats?.public || 0}
          icon={Globe}
          description="Có thể truy cập công khai"
        />
        <StatsCard
          title="Tài Liệu Riêng Tư"
          value={data?.accessStats?.private || 0}
          icon={Lock}
          description="Chỉ nội bộ"
        />
        <StatsCard
          title="Tổng Dung Lượng"
          value={formatBytes(data?.fileSizeStats?.totalSize || 0)}
          icon={File}
          description="Dung lượng tất cả tài liệu"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Document Types */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Bố Theo Loại File</CardTitle>
            <CardDescription>Số lượng tài liệu theo định dạng</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.docsByType || []}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {(data?.docsByType || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* File Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Bố Theo Kích Thước</CardTitle>
            <CardDescription>Số lượng file theo kích thước</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fileSizeData}>
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

      {/* Access Stats and Type Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Access Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Quyền Truy Cập</CardTitle>
            <CardDescription>Tài liệu công khai vs riêng tư</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={accessData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {accessData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Details */}
        <Card>
          <CardHeader>
            <CardTitle>Chi Tiết Theo Loại File</CardTitle>
            <CardDescription>Số lượng và dung lượng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.docsByType?.map((type) => (
                <div
                  key={type._id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium uppercase">{type._id}</p>
                      <p className="text-sm text-muted-foreground">
                        {type.count} files
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatBytes(type.totalSize)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(type.totalSize / type.count)}/file
                    </p>
                  </div>
                </div>
              ))}
              {(!data?.docsByType || data.docsByType.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Không có tài liệu nào
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
