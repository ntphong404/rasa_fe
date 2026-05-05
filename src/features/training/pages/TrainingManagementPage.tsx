import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpDown,
  Check,
  ChevronsUpDown,
  Eye,
  Train,
  SearchIcon,
  SlidersHorizontal,
  Upload,
  Trash2,
  Link2,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { IModel } from "@/interfaces/train.interface";
import { trainingService, myModelService } from "../api/service";
import { Command } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { TrainModelDialog } from "../components/TrainModelDialog";
import { ModelDetailsDialog } from "../components/ModelDetailsDialog";
import { PushModelDialog } from "../components/PushModelDialog";
import { useChatbotStore } from "@/store/chatbot";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

const filterSchema = z.object({
  search: z.string().optional(),
  chatbotId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
});

export function TrainingManagementPage() {
  const { t } = useTranslation();
  const refreshTrigger = useChatbotStore((state) => state.refreshTrigger);
  const [rowSelection, setRowSelection] = useState({});
  const [modelsData, setModelsData] = useState<IModel[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainDialogOpen, setTrainDialogOpen] = useState(false);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelToDelete, setModelToDelete] = useState<IModel | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);
  const [realUrlLoadingId, setRealUrlLoadingId] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: "",
      chatbotId: "",
      page: 1,
      limit: 10,
      sort: "DESC",
    },
  });

  // Fetch models data — dùng GET /api/v1/my-model
  const fetchModelsData = async (query: any) => {
    try {
      setIsDataLoading(true);
      setError(null);
      const response = await trainingService.getModels(query);
      setModelsData(response.data || []);
      setPagination({
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 10,
        total: response.meta?.total || 0,
        totalPages: response.meta?.totalPages || 0,
      });
    } catch (error) {
      console.error("Error fetching models:", error);
      setError(t("Failed to load models"));
      setModelsData([]);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchModelsData({
      page: 1,
      limit: 10,
      sort: "DESC",
    });
  }, [refreshTrigger]);

  const onSubmit = (values: z.infer<typeof filterSchema>) => {
    fetchModelsData({
      ...values,
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    const currentValues = form.getValues();
    fetchModelsData({
      ...currentValues,
      page,
    });
  };

  const handleTrainModel = () => {
    setTrainDialogOpen(true);
  };

  const handleTrainSuccess = () => {
    const currentValues = form.getValues();
    fetchModelsData({
      ...currentValues,
      page: pagination.page,
    });
  };

  const handlePushSuccess = () => {
    // Reload trang sau khi push model thành công — GET /api/v1/my-model
    fetchModelsData({
      page: 1,
      limit: pagination.limit,
      sort: "DESC",
    });
  };

  const handleViewDetails = (model: IModel) => {
    setSelectedModelId(model._id);
    setDetailsDialogOpen(true);
  };

  // Xem presigned GET URL (status / download) — GET /api/v1/my-model/:id/real-url
  const handleViewRealUrl = async (model: IModel) => {
    if (!model.url) {
      toast.warning(t("This model has no file uploaded to MinIO yet"));
      return;
    }
    try {
      setRealUrlLoadingId(model._id);
      const res = await myModelService.getRealUrl(model._id);
      window.open(res.data.realUrl, "_blank");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("Failed to get model URL"));
    } finally {
      setRealUrlLoadingId(null);
    }
  };

  const handleAskDeleteModel = (model: IModel) => {
    setModelToDelete(model);
    setConfirmDeleteOpen(true);
  };

  // Xóa model — DELETE /api/v1/my-model/:id
  const handleConfirmDeleteModel = async () => {
    if (!modelToDelete) return;
    try {
      setDeletingModelId(modelToDelete._id);
      await myModelService.deleteModel(modelToDelete._id);
      const currentValues = form.getValues();
      await fetchModelsData({ ...currentValues, page: pagination.page });
      setModelToDelete(null);
    } catch (err: any) {
      throw new Error(
        err?.response?.data?.message || t("Failed to delete model")
      );
    } finally {
      setDeletingModelId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="admin-page">
      <Form {...form}>
        <form
          className="table-controller admin-toolbar"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="search"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder={t("Search models...")}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
          >
            {t("Search")}
          </Button>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {t("Filters")}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>{t("Filter Options")}</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 pb-0 space-y-4">
                  <FormField
                    control={form.control}
                    name="limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center justify-between">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-[200px] justify-between"
                                >
                                  {field.value}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <Command>
                                  <CommandList>
                                    <CommandGroup>
                                      {[5, 10, 20, 50, 100].map((limit) => (
                                        <CommandItem
                                          key={limit}
                                          value={limit.toString()}
                                          onSelect={() => {
                                            field.onChange(limit);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === limit
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {limit}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <span className="text-sm font-medium leading-none">
                              {t("models / page")}
                            </span>
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

          {/* Nút Push Model lên MinIO */}
          <Button
            onClick={() => setPushDialogOpen(true)}
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 gap-2"
            type="button"
            id="push-model-btn"
          >
            <Upload className="h-4 w-4" />
            {t("Push Model")}
          </Button>

          {/* Nút Train Model */}
          <Button
            onClick={handleTrainModel}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            type="button"
            id="train-model-btn"
          >
            <Train className="mr-2 h-4 w-4" />
            {t("Train Model")}
          </Button>
        </form>
      </Form>

      {error ? (
        <div className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button
            onClick={() => fetchModelsData({ page: 1, limit: 10, sort: "DESC" })}
            className="mt-4"
          >
            {t("Retry")}
          </Button>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              id: "select",
              header: ({ table }) => (
                <Checkbox
                  checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                  }
                  onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                  }
                  aria-label={t("Select all")}
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label={t("Select row")}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            },
            {
              accessorKey: "name",
              header: ({ column }) => (
                <Button
                  variant="ghost"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  {t("Model Name")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              ),
              cell: ({ row }) => {
                const model = row.original as IModel;
                return (
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    {model.description && (
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              accessorKey: "isOriginal",
              header: t("Type"),
              cell: ({ row }) => {
                const isOriginal = row.getValue("isOriginal");
                return (
                  <Badge variant={isOriginal ? "default" : "secondary"}>
                    {isOriginal ? t("Original") : t("Custom")}
                  </Badge>
                );
              },
            },
            {
              accessorKey: "rules",
              header: t("Rules"),
              cell: ({ row }) => {
                const rules = row.getValue("rules") as string[];
                return <span className="text-sm">{rules?.length || 0}</span>;
              },
            },
            {
              accessorKey: "stories",
              header: t("Stories"),
              cell: ({ row }) => {
                const stories = row.getValue("stories") as string[];
                return <span className="text-sm">{stories?.length || 0}</span>;
              },
            },
            {
              accessorKey: "intents",
              header: t("Intents"),
              cell: ({ row }) => {
                const intents = row.getValue("intents") as string[];
                return <span className="text-sm">{intents?.length || 0}</span>;
              },
            },
            {
              accessorKey: "createdAt",
              header: ({ column }) => (
                <Button
                  variant="ghost"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  {t("Created At")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              ),
              cell: ({ row }) => {
                return (
                  <span className="text-sm">
                    {formatDate(row.getValue("createdAt"))}
                  </span>
                );
              },
            },
            {
              id: "actions",
              header: t("Actions"),
              cell: ({ row }) => {
                const model = row.original as IModel;
                const isDeleting = deletingModelId === model._id;
                const isLoadingUrl = realUrlLoadingId === model._id;

                return (
                  <div className="flex items-center gap-2">
                    {/* View Details — GET /api/v1/my-model/:id */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      title={t("View Details")}
                      onClick={() => handleViewDetails(model)}
                      id={`view-details-btn-${model._id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* View Status / Real URL — GET /api/v1/my-model/:id/real-url */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                      title={model.url ? t("View Model Status (MinIO URL)") : t("No file in MinIO")}
                      onClick={() => handleViewRealUrl(model)}
                      disabled={isLoadingUrl || !model.url}
                      id={`view-url-btn-${model._id}`}
                    >
                      {isLoadingUrl ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Delete — DELETE /api/v1/my-model/:id */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      title={t("Delete Model")}
                      onClick={() => handleAskDeleteModel(model)}
                      disabled={isDeleting}
                      id={`delete-model-btn-${model._id}`}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={modelsData}
          meta={pagination}
          onChangePage={handlePageChange}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          isLoading={isDataLoading}
        />
      )}

      {/* Train Model Dialog */}
      <TrainModelDialog
        open={trainDialogOpen}
        onOpenChange={setTrainDialogOpen}
        onTrainSuccess={handleTrainSuccess}
      />

      {/* Push Model to MinIO Dialog */}
      <PushModelDialog
        open={pushDialogOpen}
        onOpenChange={setPushDialogOpen}
        onPushSuccess={handlePushSuccess}
      />

      {/* Model Details Dialog */}
      <ModelDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        modelId={selectedModelId}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          setConfirmDeleteOpen(open);
          if (!open) {
            setModelToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteModel}
        title={t("Delete model")}
        description={
          modelToDelete
            ? `${t("Are you sure you want to delete model")} "${modelToDelete.name}"? ${t("This action cannot be undone.")}`
            : t("Are you sure you want to delete this item? This action cannot be undone.")
        }
        confirmLabel={t("Delete permanently")}
        successMessage={t("Model deleted successfully")}
        errorMessage={t("Failed to delete model")}
      />
    </div>
  );
}
