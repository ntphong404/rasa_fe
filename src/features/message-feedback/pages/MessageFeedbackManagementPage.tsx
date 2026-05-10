import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ConfirmHardDeleteDialog } from "@/components/confirm-delete-dialog";
import { ArrowUpDown, Eye, SearchIcon, Trash2, SlidersHorizontal } from "lucide-react";
import { useChatbotStore } from "@/store/chatbot";
import { messageFeedbackService } from "../api/service";
import { MessageFeedbackItem } from "../api/dto/MessageFeedbackResponse";

const filterSchema = z.object({
  search: z.string().optional(),
  sourceType: z.string().optional(),
  sort: z.enum(["asc", "desc"]).optional(),
});

function sourceLabel(sourceType: 0 | 1) {
  return sourceType === 1 ? "RAG" : "Rasa";
}

export function MessageFeedbackManagementPage() {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [feedbackData, setFeedbackData] = useState<MessageFeedbackItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<MessageFeedbackItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<MessageFeedbackItem | null>(null);

  const { selectedBotId, chatbots } = useChatbotStore();
  const selectedChatbot = chatbots.find((bot) => bot.botId === selectedBotId);
  const chatbotId =
    selectedChatbot?._id ||
    (selectedBotId && selectedBotId !== "global" ? selectedBotId : "");

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: "",
      sourceType: undefined,
      sort: "desc",
    },
  });

  const fetchData = async () => {
    if (!chatbotId) {
      setFeedbackData([]);
      setPagination({ total: 0, page: 1, limit: 10, totalPages: 1 });
      setIsDataLoading(false);
      return;
    }

    try {
      setIsDataLoading(true);
      setError(null);

      const listResponse = await messageFeedbackService.fetchMessageFeedbacks(chatbotId, {
        page: pagination.page,
        limit: pagination.limit,
        search: form.getValues("search"),
        sort: form.getValues("sort"),
        sourceType: form.getValues("sourceType"),
      });

      if (listResponse.success && listResponse.data) {
        setFeedbackData(listResponse.data.data || []);
        setPagination({
          total: listResponse.data.total,
          page: listResponse.data.page,
          limit: listResponse.data.limit,
          totalPages: listResponse.data.totalPages,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách feedback");
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, chatbotId]);

  const onSubmit = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleView = async (item: MessageFeedbackItem) => {
    try {
      const response = await messageFeedbackService.fetchMessageFeedbackById(chatbotId, item._id);
      if (response.success) {
        setSelectedFeedback(response.data);
        setDetailsOpen(true);
      }
    } catch {
      setSelectedFeedback(item);
      setDetailsOpen(true);
    }
  };

  const askDelete = (item: MessageFeedbackItem) => {
    setFeedbackToDelete(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!feedbackToDelete) return;
    await messageFeedbackService.hardDeleteMessageFeedback(chatbotId, feedbackToDelete._id);
    setDeleteOpen(false);
    setFeedbackToDelete(null);
    fetchData();
  };

  if (!chatbotId) {
    return (
      <div className="admin-page">
        <Alert>
          <AlertDescription>
            {t("Please select a chatbot to view message feedback")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="admin-page space-y-4">
      <Form {...form}>
        <form className="table-controller admin-toolbar" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <div className="relative">
              <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
                <SearchIcon className="h-4 w-4" />
              </div>
              <FormField
                control={form.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="search"
                        placeholder={t("Search question or answer")}
                        className="w-full rounded-lg bg-background pl-8"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit">
            <SearchIcon className="mr-2 h-4 w-4" />
            <span>{t("Search")}</span>
          </Button>

          <Drawer>
            <DrawerTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <span>{t("Filter")}</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>{t("Filter Feedbacks")}</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-4 p-4">
                  <FormField
                    control={form.control}
                    name="sourceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t("Source Type")}
                            </label>
                            <select
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || undefined)}
                              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <option value="">{t("All sources")}</option>
                              <option value="0">Rasa</option>
                              <option value="1">RAG</option>
                            </select>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">{t("Close")}</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>

          <div className="flex-1"></div>
        </form>
      </Form>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <DataTable
          columns={[
            {
              accessorKey: "questionText",
              header: ({ column }) => (
                <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                  {t("Question")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              ),
              cell: ({ row }) => (
                <div className="whitespace-normal break-words line-clamp-2 min-w-[200px]" title={row.original.questionText}>
                  {row.original.questionText}
                </div>
              ),
            },
            {
              accessorKey: "answerText",
              header: t("Answer"),
              cell: ({ row }) => (
                <div className="whitespace-normal break-words line-clamp-2 min-w-[300px]" title={row.original.answerText}>
                  {row.original.answerText}
                </div>
              ),
            },
            {
              accessorKey: "sourceType",
              header: t("Source"),
              cell: ({ row }) => (
                <Badge variant="outline" className="whitespace-nowrap">{sourceLabel(row.original.sourceType)}</Badge>
              ),
            },
            {
              accessorKey: "createdAt",
              header: t("Created At"),
              cell: ({ row }) => <span className="whitespace-nowrap">{new Date(row.original.createdAt).toLocaleString()}</span>,
            },
            {
              id: "actions",
              header: t("Actions"),
              cell: ({ row }) => (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => void handleView(row.original)}
                    title={t("View details")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-700 hover:bg-red-800"
                    onClick={() => askDelete(row.original)}
                    title={t("Delete permanently")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
          data={feedbackData}
          meta={pagination}
          onChangePage={handlePageChange}
          isLoading={isDataLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Feedback Detail")}</DialogTitle>
            <DialogDescription>{t("Disliked chatbot response details")}</DialogDescription>
          </DialogHeader>
          {selectedFeedback ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t("Question")}</p>
                <p className="mt-1 whitespace-pre-wrap">{selectedFeedback.questionText}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t("Answer")}</p>
                <p className="mt-1 whitespace-pre-wrap">{selectedFeedback.answerText}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground">{t("Source")}</p>
                  <p>{sourceLabel(selectedFeedback.sourceType)}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">{t("User")}</p>
                  <p className="font-mono text-xs break-all">{selectedFeedback.userId}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">{t("Created At")}</p>
                  <p>{new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">{t("Message ID")}</p>
                  <p className="font-mono text-xs break-all">{selectedFeedback.messageId}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmHardDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={confirmDelete} />
    </div>
  );
}
