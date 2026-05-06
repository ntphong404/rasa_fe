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
import { Separator } from "@/components/ui/separator";
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
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 border-b px-4 py-4">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold text-green-900">
                {t("Question Details")}
              </DialogTitle>
              <DialogDescription className="text-sm text-green-600">
                {t("View detailed information about this question")}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {selectedQuestion && (
              <>
                {/* Question */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">{t("Question")}</label>
                  <div className="rounded-lg bg-gradient-to-r from-green-50 to-teal-50 border border-green-100 px-3 py-2 shadow-sm">
                    <p className="text-sm leading-relaxed text-slate-700">{selectedQuestion.question}</p>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">{t("Reason")}</label>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <p className="text-sm text-slate-600">
                      {selectedQuestion.reason ? (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {selectedQuestion.reason}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">-</span>
                      )}
                    </p>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">{t("Count")}</label>
                    <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedQuestion.count || 1}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">{t("Last Seen At")}</label>
                    <div className="rounded-lg bg-purple-50 border border-purple-100 px-3 py-2">
                      <p className="text-xs text-purple-700 font-medium">
                        {selectedQuestion.lastSeenAt
                          ? new Date(selectedQuestion.lastSeenAt).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                {/* Created At */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">{t("Created At")}</label>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <p className="text-xs text-slate-600">
                      {new Date(selectedQuestion.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-slate-50 px-4 py-3 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setDetailsOpen(false)}
              className="border-slate-300 hover:bg-slate-100"
            >
              {t("Close")}
            </Button>
          </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-4 py-4">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold text-blue-900">
                {editingQuestion ? t("Edit Question") : t("Create New Question")}
              </DialogTitle>
              <DialogDescription className="text-sm text-blue-600">
                {editingQuestion
                  ? t("Update the suggested question details")
                  : t("Add a new suggested question")}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Form Content */}
          <div className="overflow-y-auto px-4 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* Question Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                {t("Question")} <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.question}
                onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                placeholder={t("Enter question")}
                className="min-h-[100px] border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-100 rounded-lg resize-none"
              />
              {!formData.question.trim() && error && (
                <p className="text-xs text-red-500">{t("Question is required")}</p>
              )}
            </div>

            <Separator className="bg-slate-200" />

            {/* Reason Type Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                {t("Reason Type")}
              </label>
              <Select 
                value={formData.reasonType} 
                onValueChange={(value) => 
                  setFormData((prev) => ({ 
                    ...prev, 
                    reasonType: value, 
                    customReason: value === "Other" ? prev.customReason : "" 
                  }))
                }
              >
                <SelectTrigger className="border-2 border-slate-200 focus:border-blue-400 focus:ring-blue-100">
                  <SelectValue placeholder={t("Select reason type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAQ">
                    <span className="text-sm">{t("FAQ")}</span>
                  </SelectItem>
                  <SelectItem value="Popular Search">
                    <span className="text-sm">{t("Popular Search")}</span>
                  </SelectItem>
                  <SelectItem value="User Feedback">
                    <span className="text-sm">{t("User Feedback")}</span>
                  </SelectItem>
                  <SelectItem value="Training Data">
                    <span className="text-sm">{t("Training Data")}</span>
                  </SelectItem>
                  <SelectItem value="Trending">
                    <span className="text-sm">{t("Trending")}</span>
                  </SelectItem>
                  <SelectItem value="Other">
                    <span className="text-sm">{t("Other")}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Reason Field (shown only when "Other" is selected) */}
            {formData.reasonType === "Other" && (
              <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t("Custom Reason")}
                </label>
                <Input
                  type="text"
                  value={formData.customReason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customReason: e.target.value }))}
                  placeholder={t("Enter custom reason")}
                  className="border-2 border-blue-300 focus:border-blue-400 focus:ring-blue-100"
                />
              </div>
            )}
          </div>

          {/* Footer with Actions */}
          <div className="border-t bg-slate-50 px-4 py-3 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetFormData();
              }}
              className="border-slate-300 hover:bg-slate-100"
            >
              {t("Cancel")}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
