
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import {
  ArrowUpDown,
  Check,
  ChevronsUpDown,
  SearchIcon,
  SlidersHorizontal,
  Trash2,
  Eye,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ConfirmHardDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { uQuestionService } from "../api/service";
import { UQuestion, ListUQuestionResponse } from "../api/dto/UQuestionResponse";

const filterSchema = z.object({
  search: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.enum(["asc", "desc"]).optional(),
  chatbotId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

interface UQuestionDetailsDialogProps {
  uquestion: UQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UQuestionDetailsDialog({
  uquestion,
  open,
  onOpenChange,
}: UQuestionDetailsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{t("UQuestion Details")}</DialogTitle>
          <DialogDescription>
            {t("Details for unanswered question")}
          </DialogDescription>
        </DialogHeader>
        {uquestion ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">
                {t("Question")}:
              </label>
              <p className="mt-1 text-base">{uquestion.question}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">
                {t("Related Chatbot")}:
              </label>
              <p className="mt-1">
                <Badge variant="outline">
                  {typeof uquestion.chatbotId === "object"
                    ? uquestion.chatbotId.name || uquestion.chatbotId._id
                    : uquestion.chatbotId}
                </Badge>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  {t("Created At")}:
                </label>
                <p className="mt-1 text-sm">
                  {new Date(uquestion.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  {t("Updated At")}:
                </label>
                <p className="mt-1 text-sm">
                  {new Date(uquestion.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {t("No question selected")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UQuestionManagement() {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [uquestionsData, setUQuestionsData] = useState<UQuestion[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [uquestionToDelete, setUQuestionToDelete] = useState<UQuestion | null>(null);
  const [selectedUQuestion, setSelectedUQuestion] = useState<UQuestion | null>(null);

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
      page: 1,
      limit: 10,
      sort: "desc",
      chatbotId: undefined,
      startDate: undefined,
      endDate: undefined,
    },
  });

  const fetchUQuestionsData = async (filters?: z.infer<typeof filterSchema>) => {
    try {
      setIsDataLoading(true);

      const queryParams = filters || {
        page: pagination.page,
        limit: pagination.limit,
        search: form.getValues("search"),
        sort: form.getValues("sort"),
        chatbotId: form.getValues("chatbotId"),
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
      };

      const response: ListUQuestionResponse = await uQuestionService.fetchUQuestions(queryParams);

      if (response.success && response.data && Array.isArray(response.data.data)) {
        setUQuestionsData(response.data.data);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages,
        });
      } else {
        throw new Error("Invalid data format received from API");
      }
    } catch (err) {
      setError(
        `Failed to fetch unanswered questions: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Error fetching unanswered questions:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchUQuestionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUQuestionsData({
      page: 1,
      limit: data.limit || pagination.limit,
      search: data.search,
      sort: data.sort,
      chatbotId: data.chatbotId,
      startDate: data.startDate,
      endDate: data.endDate,
    });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleAskDeleteUQuestion = (uquestion: UQuestion) => {
    setUQuestionToDelete(uquestion);
    setConfirmHardDeleteOpen(true);
  };

  const handleConfirmHardDelete = async () => {
    if (uquestionToDelete) {
      try {
        await uQuestionService.hardDeleteUQuestion(uquestionToDelete._id);
        setUQuestionToDelete(null);
        setConfirmHardDeleteOpen(false);
        fetchUQuestionsData();
      } catch (error) {
        console.error("Error deleting unanswered question:", error);
      }
    }
  };

  const handleViewDetails = (uquestion: UQuestion) => {
    setSelectedUQuestion(uquestion);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="relative p-3">
      <Form {...form}>
        <form
          className="table-controller py-4 flex gap-4 flex-col sm:flex-row"
          onSubmit={form.handleSubmit(onSubmit)}
        >
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
                        id="search"
                        type="search"
                        placeholder={t("Search unanswered questions")}
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
              <Button className="bg-blue-600">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <span>{t("Filter")}</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>{t("Filter UQuestions")}</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-4 p-4">
                  <FormField
                    control={form.control}
                    name="sort"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t("Sort by")}
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {field.value === "desc"
                                    ? t("Newest first")
                                    : field.value === "asc"
                                    ? t("Oldest first")
                                    : t("Select sort")}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandList>
                                    <CommandGroup>
                                      {[ 
                                        { value: "desc", label: t("Newest first") },
                                        { value: "asc", label: t("Oldest first") },
                                      ].map((option) => (
                                        <CommandItem
                                          key={option.value}
                                          value={option.value}
                                          onSelect={() => {
                                            form.setValue("sort", option.value as "asc" | "desc");
                                          }}
                                        >
                                          {option.label}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              option.value === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t("Start Date")}
                            </label>
                            <Input type="date" {...field} value={field.value || ""} />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t("End Date")}
                            </label>
                            <Input type="date" {...field} value={field.value || ""} />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FormItem className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-[100px] justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? field.value : t("Select limit")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[100px] p-0">
                                <Command>
                                  <CommandList>
                                    <CommandGroup>
                                      {[10, 20, 30, 40, 50].map((limit) => (
                                        <CommandItem
                                          value={limit.toString()}
                                          key={limit}
                                          onSelect={() => {
                                            form.setValue("limit", limit);
                                          }}
                                        >
                                          {limit}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              limit === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <span className="text-sm font-medium leading-none">
                              {t("questions / page")}
                            </span>
                          </FormItem>
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
        <div className="p-8 text-center">
          <div className="text-red-500 mb-2">
            {t("Error loading unanswered questions")}
          </div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              id: "select",
              header: ({ table }) => (
                <input
                  type="checkbox"
                  checked={table.getIsAllPageRowsSelected()}
                  onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
                />
              ),
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  checked={row.getIsSelected()}
                  onChange={(e) => row.toggleSelected(e.target.checked)}
                />
              ),
            },
            {
              accessorKey: "question",
              header: ({ column }) => (
                <Button
                  variant="ghost"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  {t("Question")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              ),
              cell: ({ row }) => (
                <div className="font-medium max-w-md truncate">
                  {row.getValue("question")}
                </div>
              ),
            },
            {
              accessorKey: "createdAt",
              header: t("Created At"),
              cell: ({ row }) => (
                <div className="text-sm">
                  {new Date(row.getValue("createdAt")).toLocaleString()}
                </div>
              ),
            },
            {
              id: "actions",
              header: t("Actions"),
              cell: ({ row }) => {
                const uquestion = row.original;

                return (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewDetails(uquestion)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      title={t("View details")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleAskDeleteUQuestion(uquestion)}
                      title={t("Delete permanently")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={uquestionsData}
          meta={pagination}
          onChangePage={handlePageChange}
          isLoading={isDataLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}

      <UQuestionDetailsDialog
        uquestion={selectedUQuestion}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <ConfirmHardDeleteDialog
        open={confirmHardDeleteOpen}
        onOpenChange={setConfirmHardDeleteOpen}
        onConfirm={handleConfirmHardDelete}
      />
    </div>
  );
}