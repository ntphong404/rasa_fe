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
  // Download,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { IModel } from "@/interfaces/train.interface";
import { trainingService } from "../api/service";
import { Command } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { TrainModelDialog } from "../components/TrainModelDialog";
import { ModelDetailsDialog } from "../components/ModelDetailsDialog";
import { useChatbotStore } from "@/store/chatbot";

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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

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

  // Fetch models data
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
      setError("Failed to load models");
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
    // Refresh the models list after successful training
    const currentValues = form.getValues();
    fetchModelsData({
      ...currentValues,
      page: pagination.page,
    });
  };

  const handleViewDetails = (model: IModel) => {
    setSelectedModelId(model._id);
    setDetailsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="relative p-3">
      <Form {...form}>
        <form
          className="table-controller py-4 flex gap-4 flex-col sm:flex-row"
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
          <Button
            onClick={handleTrainModel}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            type="button"
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
                  aria-label="Select all"
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Select row"
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

                return (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      title={t("View Details")}
                      onClick={() => handleViewDetails(model)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* Temporarily hidden download button */}
                    {/* {model.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        title={t("Download Model")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )} */}
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

      {/* Model Details Dialog */}
      <ModelDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        modelId={selectedModelId}
      />
    </div>
  );
}
