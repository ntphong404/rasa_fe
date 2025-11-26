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
  Edit,
  Eye,
  Plus,
  SearchIcon,
  SlidersHorizontal,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { IIntent } from "@/interfaces/intent.interface";
import { intentService } from "../api/service";
import { ListIntentResponse } from "../api/dto/IntentResponse";
import { ConfirmSoftDeleteDialog, ConfirmHardDeleteDialog } from "@/components/confirm-delete-dialog";
import { ConfirmRestoreDialog } from "@/components/confirm-restore-dialog";
import { Command } from "@/components/ui/command";
import IntentDetailsDialog from "../components/IntentDetailsDialog";

const filterSchema = z.object({
  search: z.string().optional(),
  deleted: z.boolean().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export function IntentManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rowSelection, setRowSelection] = useState({});
  const [intentsData, setIntentsData] = useState<IIntent[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [confirmSoftDeleteOpen, setConfirmSoftDeleteOpen] = useState(false);
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [intentToDelete, setIntentToDelete] = useState<IIntent | null>(null);
  const [intentToRestore, setIntentToRestore] = useState<IIntent | null>(null);

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
      deleted: false,
      page: 1,
      limit: 10,
      sort: "DESC",
      startDate: undefined,
      endDate: undefined,
    },
  });

  const fetchIntentsData = async (filters?: z.infer<typeof filterSchema>) => {
    try {
      setIsDataLoading(true);
      
      const queryParams = filters || {
        page: pagination.page,
        limit: pagination.limit,
        search: form.getValues("search"),
        deleted: form.getValues("deleted"),
        sort: form.getValues("sort"),
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
      };

      const response: ListIntentResponse = await intentService.fetchIntents(queryParams);

      if (response.success && Array.isArray(response.data)) {
        setIntentsData(response.data);
        setPagination({
          total: response.meta.total,
          page: response.meta.page,
          limit: response.meta.limit,
          totalPages: response.meta.totalPages,
        });
      } else {
        throw new Error("Invalid data format received from API");
      }
    } catch (err) {
      setError(
        `Failed to fetch intents: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Error fetching intents:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchIntentsData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchIntentsData({
      page: 1,
      limit: data.limit || pagination.limit,
      search: data.search,
      deleted: data.deleted,
      sort: data.sort,
      startDate: data.startDate,
      endDate: data.endDate,
    });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleAskDeleteIntent = (intent: IIntent) => {
    setIntentToDelete(intent);
    if (intent.deleted) {
      setConfirmHardDeleteOpen(true);
    } else {
      setConfirmSoftDeleteOpen(true);
    }
  };

  const handleCreateIntent = () => {
    navigate("/intents/new");
  };

  const handleEditIntent = (intent: IIntent) => {
    navigate("/intents/edit", { state: { intent } });
  };

  const handleConfirmSoftDelete = async () => {
    if (intentToDelete) {
      try {
        await intentService.softDeleteIntent(intentToDelete._id);
        setIntentToDelete(null);
        setConfirmSoftDeleteOpen(false);
        fetchIntentsData();
      } catch (error) {
        console.error("Error soft deleting intent:", error);
      }
    }
  };

  const handleConfirmHardDelete = async () => {
    if (intentToDelete) {
      try {
        await intentService.hardDeleteIntent(intentToDelete._id);
        setIntentToDelete(null);
        setConfirmHardDeleteOpen(false);
        fetchIntentsData();
      } catch (error) {
        console.error("Error hard deleting intent:", error);
      }
    }
  };

  const handleAskRestoreIntent = (intent: IIntent) => {
    setIntentToRestore(intent);
    setConfirmRestoreOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (intentToRestore) {
      try {
        await intentService.restoreIntent(intentToRestore._id);
        setIntentToRestore(null);
        setConfirmRestoreOpen(false);
        fetchIntentsData();
      } catch (error) {
        console.error("Error restoring intent:", error);
      }
    }
  };

  const handleViewDetails = (intent: IIntent) => {
    setSelectedIntentId(intent._id);
    setDetailsDialogOpen(true);
  };

  // const refreshIntents = () => {
  //   setPagination((prev) => ({ ...prev, page: 1 }));
  //   fetchIntentsData({
  //     page: 1,
  //     limit: pagination.limit,
  //     search: form.getValues("search"),
  //     deleted: form.getValues("deleted"),
  //     sort: form.getValues("sort"),
  //     startDate: form.getValues("startDate"),
  //     endDate: form.getValues("endDate"),
  //   });
  // };

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
                        placeholder={t("Search intents")}
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
                  <DrawerTitle>{t("Filter Intents")}</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-4 p-4">
                  <FormField
                    control={form.control}
                    name="deleted"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intent-filter-deleted"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="intent-filter-deleted"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t("Show deleted intents")}
                            </label>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
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
                                  {
                                    field.value === "DESC"
                                      ? t("Newest first")
                                      : field.value === "ASC"
                                      ? t("Oldest first")
                                      : t("Select sort")
                                  }
                                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandList>
                                    <CommandGroup>
                                      {[
                                        { value: "DESC", label: t("Newest first") },
                                        { value: "ASC", label: t("Oldest first") },
                                      ].map((option) => (
                                        <CommandItem
                                          key={option.value}
                                          value={option.value}
                                          onSelect={() => {
                                            form.setValue("sort", option.value);
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
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ""}
                            />
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
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ""}
                            />
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
                                    {field.value
                                      ? field.value
                                      : t("Select limit")}
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
                              {t("intents / page")}
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
          <Button
            onClick={handleCreateIntent}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("Create Intent")}
          </Button>
        </form>
      </Form>

      {error ? (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-2">{t("Error loading intents")}</div>
          <div className="text-sm text-muted-foreground">
            {error}
          </div>
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
                  {t("Intent Name")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              ),
              cell: ({ row }) => (
                <div className="font-medium">
                  {row.getValue("name")}
                </div>
              ),
            },
            {
              accessorKey: "description",
              header: ({ column }) => (
                <Button
                  variant="ghost"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  {t("Description")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              ),
              cell: ({ row }) => (
                <div className="text-sm text-muted-foreground max-w-md truncate">
                  {row.getValue("description") || t("No description")}
                </div>
              ),
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
                const intent = row.original;
                const isDeleted = intent.deleted;
                
                return (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewDetails(intent)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      title={t("View details")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!isDeleted && (
                      <Button
                        onClick={() => handleEditIntent(intent)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {isDeleted ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAskRestoreIntent(intent)}
                          title={t("Restore from trash")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-700 hover:bg-red-800"
                          onClick={() => handleAskDeleteIntent(intent)}
                          title={t("Delete permanently")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleAskDeleteIntent(intent)}
                        title={t("Move to trash")}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              },
            },
          ]}
          data={intentsData}
          meta={pagination}
          onChangePage={handlePageChange}
          isLoading={isDataLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}

      <ConfirmSoftDeleteDialog
        open={confirmSoftDeleteOpen}
        onOpenChange={setConfirmSoftDeleteOpen}
        onConfirm={handleConfirmSoftDelete}
      />

      <ConfirmHardDeleteDialog
        open={confirmHardDeleteOpen}
        onOpenChange={setConfirmHardDeleteOpen}
        onConfirm={handleConfirmHardDelete}
      />

      <ConfirmRestoreDialog
        open={confirmRestoreOpen}
        onOpenChange={setConfirmRestoreOpen}
        onConfirm={handleConfirmRestore}
      />

      <IntentDetailsDialog
        intentId={selectedIntentId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <div
        className={cn(
          "absolute bottom-24 right-1/2 translate-x-1/2 translate-y-1/2 hidden",
          Object.keys(rowSelection).length > 0 && "block"
        )}
      >
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md">
          {Object.keys(rowSelection).length} {t("items selected")}
        </div>
      </div>
    </div>
  );
}