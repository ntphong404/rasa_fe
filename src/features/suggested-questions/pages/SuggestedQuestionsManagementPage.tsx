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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Edit, Eye, SearchIcon, Trash2, Plus } from "lucide-react";
import { useChatbotStore } from "@/store/chatbot";
import { suggestedQuestionService } from "../api/service";
import { SuggestedQuestion } from "../api/dto/SuggestedQuestionsResponse";
import { Textarea } from "@/components/ui/textarea";

const filterSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["asc", "desc"]).optional(),
});

export function SuggestedQuestionsManagementPage() {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [questionsData, setQuestionsData] = useState<SuggestedQuestion[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<SuggestedQuestion | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<SuggestedQuestion | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SuggestedQuestion | null>(null);

  const { selectedBotId, chatbots } = useChatbotStore();
  const selectedChatbot = chatbots.find((bot) => bot.botId === selectedBotId);
  const chatbotId = selectedChatbot?._id || selectedBotId || "";

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
      sort: "desc",
    },
  });

  // Form for create/edit
  const [formData, setFormData] = useState({
    question: "",
    reasonType: "", // "FAQ", "Popular Search", "User Feedback", "Training Data", "Trending", or "Other"
    customReason: "", // Only used when reasonType is "Other"
  });

  const resetFormData = () => {
    setFormData({ question: "", reasonType: "", customReason: "" });
    setEditingQuestion(null);
  };

  const fetchData = async () => {
    if (!chatbotId) {
      setQuestionsData([]);
      setPagination({ total: 0, page: 1, limit: 10, totalPages: 1 });
      setIsDataLoading(false);
      return;
    }

    try {
      setIsDataLoading(true);
      setError(null);

      const listResponse = await suggestedQuestionService.fetchSuggestedQuestions(chatbotId, {
        page: pagination.page,
        limit: pagination.limit,
        search: form.getValues("search"),
        sort: form.getValues("sort"),
      });

      if (listResponse.success && listResponse.data) {
        setQuestionsData(listResponse.data.data || []);
        setPagination({
          total: listResponse.data.total,
          page: listResponse.data.page,
          limit: listResponse.data.limit,
          totalPages: listResponse.data.totalPages,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Unable to load suggested questions"));
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

  const handleView = async (item: SuggestedQuestion) => {
    try {
      const response = await suggestedQuestionService.fetchSuggestedQuestionById(chatbotId, item._id);
      if (response.success) {
        setSelectedQuestion(response.data);
        setDetailsOpen(true);
      }
    } catch {
      setSelectedQuestion(item);
      setDetailsOpen(true);
    }
  };

  const handleCreate = () => {
    resetFormData();
    setIsCreateOpen(true);
  };

  const handleEdit = (item: SuggestedQuestion) => {
    setEditingQuestion(item);
    const predefinedReasons = ["FAQ", "Popular Search", "User Feedback", "Training Data", "Trending"];
    const reason = item.reason || "";
    
    // Check if reason matches one of the predefined types
    const reasonType = predefinedReasons.includes(reason) ? reason : (reason ? "Other" : "");
    const customReason = reasonType === "Other" ? reason : "";

    setFormData({
      question: item.question,
      reasonType,
      customReason,
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question.trim()) {
      setError(t("Question is required"));
      return;
    }

    try {
      // Construct the final reason
      const finalReason = 
        formData.reasonType === "Other" 
          ? (formData.customReason || "")
          : formData.reasonType || "";

      if (editingQuestion) {
        // Update
        await suggestedQuestionService.updateSuggestedQuestion(chatbotId, editingQuestion._id, {
          question: formData.question,
          reason: finalReason || undefined,
        });
      } else {
        // Create
        await suggestedQuestionService.createSuggestedQuestion(chatbotId, {
          question: formData.question,
          reason: finalReason || undefined,
        });
      }
      setIsEditOpen(false);
      setIsCreateOpen(false);
      resetFormData();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Unable to save question"));
    }
  };

  const askDelete = (item: SuggestedQuestion) => {
    setQuestionToDelete(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    try {
      await suggestedQuestionService.hardDeleteSuggestedQuestion(chatbotId, questionToDelete._id);
      setDeleteOpen(false);
      setQuestionToDelete(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Unable to delete question"));
    }
  };

  if (!chatbotId) {
    return (
      <div className="admin-page">
        <Alert>
          <AlertDescription>
            {t("Please select a chatbot to view suggested questions")}
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
                        placeholder={t("Search questions")}
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

          <div className="flex-1"></div>

          <Button
            type="button"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>{t("Create")}</span>
          </Button>
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
              accessorKey: "question",
              header: ({ column }) => (
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                  {t("Question")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              ),
              cell: ({ row }) => {
                const question = row.original as SuggestedQuestion;
                return (
                  <div
                    className="whitespace-normal break-words line-clamp-2 min-w-[300px]"
                    title={question.question}
                  >
                    {question.question}
                  </div>
                );
              },
            },
            {
              accessorKey: "reason",
              header: t("Reason"),
              cell: ({ row }) => {
                const question = row.original as SuggestedQuestion;
                return (
                  <div className="whitespace-normal break-words line-clamp-1 min-w-[150px]">
                    {question.reason || "-"}
                  </div>
                );
              },
            },
            {
              accessorKey: "count",
              header: t("Count"),
              cell: ({ row }) => {
                const question = row.original as SuggestedQuestion;
                return <span className="whitespace-nowrap">{question.count || 1}</span>;
              },
            },
            {
              accessorKey: "createdAt",
              header: t("Created At"),
              cell: ({ row }) => {
                const question = row.original as SuggestedQuestion;
                return (
                  <span className="whitespace-nowrap">
                    {new Date(question.createdAt).toLocaleString()}
                  </span>
                );
              },
            },
            {
              id: "actions",
              header: t("Actions"),
              cell: ({ row }) => {
                const question = row.original as SuggestedQuestion;
                return (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => void handleView(question)}
                      title={t("View details")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleEdit(question)}
                      title={t("Edit")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-700 hover:bg-red-800"
                      onClick={() => askDelete(question)}
                      title={t("Delete permanently")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={questionsData}
          isLoading={isDataLoading}
          meta={pagination}
          onChangePage={handlePageChange}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Question Details")}</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("Question")}</label>
                <p className="text-sm text-gray-600 mt-1">{selectedQuestion.question}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t("Reason")}</label>
                <p className="text-sm text-gray-600 mt-1">{selectedQuestion.reason || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t("Count")}</label>
                <p className="text-sm text-gray-600 mt-1">{selectedQuestion.count || 1}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t("Last Seen At")}</label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedQuestion.lastSeenAt
                    ? new Date(selectedQuestion.lastSeenAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">{t("Created At")}</label>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedQuestion.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetFormData();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? t("Edit Question") : t("Create New Question")}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? t("Update the suggested question details")
                : t("Add a new suggested question")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("Question")} *</label>
              <Textarea
                value={formData.question}
                onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                placeholder={t("Enter question")}
                className="mt-1 min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("Reason Type")}</label>
              <Select value={formData.reasonType} onValueChange={(value) => 
                setFormData((prev) => ({ ...prev, reasonType: value, customReason: value === "Other" ? prev.customReason : "" }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("Select reason type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAQ">{t("FAQ")}</SelectItem>
                  <SelectItem value="Popular Search">{t("Popular Search")}</SelectItem>
                  <SelectItem value="User Feedback">{t("User Feedback")}</SelectItem>
                  <SelectItem value="Training Data">{t("Training Data")}</SelectItem>
                  <SelectItem value="Trending">{t("Trending")}</SelectItem>
                  <SelectItem value="Other">{t("Other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.reasonType === "Other" && (
              <div>
                <label className="text-sm font-medium">{t("Custom Reason")}</label>
                <Input
                  type="text"
                  value={formData.customReason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customReason: e.target.value }))}
                  placeholder={t("Enter custom reason")}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetFormData();
              }}
            >
              {t("Cancel")}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSave}
            >
              {t("Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmHardDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title={t("Delete Question")}
        description={t("Are you sure you want to permanently delete this question?")}
      />
    </div>
  );
}
