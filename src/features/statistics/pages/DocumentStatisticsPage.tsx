import { useState } from "react";
import { useDocumentStatistics } from "@/hooks/useStatistics";
import { StatsCard } from "../components/StatsCard";
import { ExportReportDialog } from "../components/ExportReportDialog";
import { Button } from "@/components/ui/button";
import { FileText, File, Lock, Globe, FileDown } from "lucide-react";
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
import { useChatbotStore } from "@/store/chatbot";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D'];

export const DocumentStatisticsPage = () => {
  const { t } = useTranslation();
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const scopedBotId = selectedBotId && selectedBotId !== 'global' ? selectedBotId : undefined;
  const documents = useDocumentStatistics({ botId: scopedBotId });
  const [exportOpen, setExportOpen] = useState(false);

  if (documents.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">{t("Document Report")}</h1>
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
            {t("Failed to load document statistics. Please try again later.")}
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
    { name: t("Small (< 1MB)"), value: data?.fileSizeStats?.smallFiles || 0 },
    { name: t("Medium (1-10MB)"), value: data?.fileSizeStats?.mediumFiles || 0 },
    { name: t("Large (>= 10MB)"), value: data?.fileSizeStats?.largeFiles || 0 },
  ];

  const accessData = [
    { name: t("Public"), value: data?.accessStats?.public || 0 },
    { name: t("Private"), value: data?.accessStats?.private || 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t("Document Report")}</h1>
          <p className="text-muted-foreground">
            {t("Statistics on documents in the system")}
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
        defaultSections={['documents']}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("Total Documents")}
          value={data?.totalDocs || 0}
          icon={FileText}
          description={t("All documents")}
        />
        <StatsCard
          title={t("Public Documents")}
          value={data?.accessStats?.public || 0}
          icon={Globe}
          description={t("Publicly accessible")}
        />
        <StatsCard
          title={t("Private Documents")}
          value={data?.accessStats?.private || 0}
          icon={Lock}
          description={t("Internal only")}
        />
        <StatsCard
          title={t("Total Size")}
          value={formatBytes(data?.fileSizeStats?.totalSize || 0)}
          icon={File}
          description={t("Size of all documents")}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Document Types */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Distribution by File Type")}</CardTitle>
            <CardDescription>{t("Number of documents by format")}</CardDescription>
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
            <CardTitle>{t("Distribution by Size")}</CardTitle>
            <CardDescription>{t("Number of files by size")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fileSizeData}>
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

      {/* Access Stats and Type Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Access Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Access Rights Distribution")}</CardTitle>
            <CardDescription>{t("Public vs private documents")}</CardDescription>
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
            <CardTitle>{t("Details by File Type")}</CardTitle>
            <CardDescription>{t("Quantity and size")}</CardDescription>
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
                  {t("No documents found")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
