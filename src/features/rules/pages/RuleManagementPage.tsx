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
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { IRule } from "@/interfaces/rule.interface";
import { ruleService } from "../api/service";
import { ListRuleResponse } from "../api/dto/RuleResponse";
import {
  ConfirmSoftDeleteDialog,
  ConfirmHardDeleteDialog,
} from "@/components/confirm-delete-dialog";
import { ConfirmRestoreDialog } from "@/components/confirm-restore-dialog";
import { Command } from "@/components/ui/command";
import RuleDetailsDialog from "../components/RuleDetailsDialog";
import { useChatbotStore } from "@/store/chatbot";

const filterSchema = z.object({
  search: z.string().optional(),
  deleted: z.boolean().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export function RuleManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const refreshTrigger = useChatbotStore((state) => state.refreshTrigger);
  const [rowSelection, setRowSelection] = useState({});
  const [rulesData, setRulesData] = useState<IRule[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [confirmSoftDeleteOpen, setConfirmSoftDeleteOpen] = useState(false);
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<IRule | null>(null);
  const [ruleToRestore, setRuleToRestore] = useState<IRule | null>(null);
  const isInitialMount = useRef(true);

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

  // Watch form values for automatic filtering
  const watchedValues = useWatch({ control: form.control });

  // Debounce search value
  const [debouncedSearchValue, setDebouncedSearchValue] = useState(
    watchedValues.search || ""
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchValue(watchedValues.search || "");
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [watchedValues.search]);

  const fetchRulesData = async (filters?: z.infer<typeof filterSchema>) => {
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

      const response: ListRuleResponse = await ruleService.fetchRules(
        queryParams
      );

      if (response.success && Array.isArray(response.data)) {
        setRulesData(response.data);
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
        `Failed to fetch rules: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Error fetching rules:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Initial fetch + pagination changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchRulesData();
    } else {
      fetchRulesData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, refreshTrigger]);

  // Auto-filter when non-search form values change (immediate)
  useEffect(() => {
    // Skip initial render to avoid duplicate call
    if (isInitialMount.current || (!watchedValues.deleted && !watchedValues.startDate && !watchedValues.endDate)) {
      return;
    }
    
    const { page, search, ...otherFilters } = watchedValues;
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRulesData({
      page: 1,
      limit: watchedValues.limit || pagination.limit,
      search: debouncedSearchValue, // Use debounced search
      ...otherFilters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedValues.deleted,
    watchedValues.sort,
    watchedValues.startDate,
    watchedValues.endDate,
  ]);

  // Auto-filter when debounced search value changes
  useEffect(() => {
    // Skip if search is empty on initial render or is initial mount
    if (isInitialMount.current || !debouncedSearchValue) {
      return;
    }
    
    const { page, search, ...otherFilters } = watchedValues;
    // Reset to page 1 when search changes
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRulesData({
      page: 1,
      limit: watchedValues.limit || pagination.limit,
      search: debouncedSearchValue,
      ...otherFilters,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue]);

  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRulesData({
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
    // Don't allow page changes when there are no results or invalid page
    if (
      pagination.totalPages === 0 ||
      page < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleAskDeleteRule = (rule: IRule) => {
    setRuleToDelete(rule);
    if (rule.deleted) {
      setConfirmHardDeleteOpen(true);
    } else {
      setConfirmSoftDeleteOpen(true);
    }
  };

  const handleCreateRule = () => {
    navigate("/rules/new");
  };

  const handleEditRule = (rule: IRule) => {
    navigate("/rules/edit", { state: { rule } });
  };

  const handleConfirmSoftDelete = async () => {
    if (ruleToDelete) {
      try {
        await ruleService.softDeleteRule(ruleToDelete._id);
        setRuleToDelete(null);
        setConfirmSoftDeleteOpen(false);
        fetchRulesData();
      } catch (error) {
        console.error("Error soft deleting rule:", error);
      }
    }
  };

  const handleConfirmHardDelete = async () => {
    if (ruleToDelete) {
      try {
        await ruleService.hardDeleteRule(ruleToDelete._id);
        setRuleToDelete(null);
        setConfirmHardDeleteOpen(false);
        fetchRulesData();
      } catch (error) {
        console.error("Error hard deleting rule:", error);
      }
    }
  };

  const handleAskRestoreRule = (rule: IRule) => {
    setRuleToRestore(rule);
    setConfirmRestoreOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (ruleToRestore) {
      try {
        await ruleService.restoreRule(ruleToRestore._id);
        toast.success(t("Rule restored successfully"));
        setRuleToRestore(null);
        setConfirmRestoreOpen(false);
        fetchRulesData();
      } catch (error: any) {
        console.error("Error restoring rule:", error);
        toast.error(
          t("Failed to restore rule") +
            `: ${error.response?.data?.message || error.message}`
        );
      }
    }
  };

  const handleViewDetails = (rule: IRule) => {
    setSelectedRuleId(rule._id);
    setDetailsDialogOpen(true);
  };

  const sortOptions = [
    { value: "ASC", label: t("Oldest") },
    { value: "DESC", label: t("Newest") },
  ];

  const columns = [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("Name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: any) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      id: "description",
      accessorKey: "description",
      header: t("Description"),
      cell: ({ row }: any) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {row.getValue("description") || t("No description")}
        </div>
      ),
    },
    {
      id: "intents",
      accessorKey: "intents",
      header: t("Intents"),
      cell: ({ row }: any) => {
        const intents = row.getValue("intents") as any[];
        return (
          <div className="text-sm">
            {intents && intents.length > 0
              ? `${intents.length} ${t("intents")}`
              : t("No intents")}
          </div>
        );
      },
    },
    {
      id: "action",
      accessorKey: "action",
      header: t("Actions"),
      cell: ({ row }: any) => {
        const actions = row.getValue("action") as any[];
        return (
          <div className="text-sm">
            {actions && actions.length > 0
              ? `${actions.length} ${t("actions")}`
              : t("No actions")}
          </div>
        );
      },
    },
    {
      id: "responses",
      accessorKey: "responses",
      header: t("Responses"),
      cell: ({ row }: any) => {
        const responses = row.getValue("responses") as any[];
        return (
          <div className="text-sm">
            {responses && responses.length > 0
              ? `${responses.length} ${t("responses")}`
              : t("No responses")}
          </div>
        );
      },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: t("Created At"),
      cell: ({ row }: any) => (
        <div className="text-sm">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions_column",
      header: t("Operations"),
      cell: ({ row }: any) => {
        const rule = row.original as IRule;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleViewDetails(rule)}
              title={t("View details")}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!rule.deleted && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleEditRule(rule)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {rule.deleted ? (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAskRestoreRule(rule)}
                title={t("Restore from trash")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => handleAskDeleteRule(rule)}
                title={t("Move to trash")}
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            {rule.deleted && (
              <Button
                size="sm"
                className="bg-red-700 hover:bg-red-800"
                onClick={() => handleAskDeleteRule(rule)}
                title={t("Delete permanently")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

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
                        placeholder={t("Search rules")}
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
                  <DrawerTitle>{t("Filter Rules")}</DrawerTitle>
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
                              id="rule-filter-deleted"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="rule-filter-deleted"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t("Show deleted rules")}
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
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? sortOptions.find(
                                          (option) =>
                                            option.value === field.value
                                        )?.label
                                      : t("Select sort order")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandList>
                                    <CommandGroup>
                                      {sortOptions.map((option) => (
                                        <CommandItem
                                          key={option.value}
                                          value={option.value}
                                          onSelect={() => {
                                            field.onChange(option.value);
                                          }}
                                        >
                                          {option.label}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              field.value === option.value
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
                                              field.value === limit
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
                              {t("rules / page")}
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
            onClick={handleCreateRule}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("Create Rule")}
          </Button>
        </form>
      </Form>

      {error && <div className="text-red-600 text-center py-4">{error}</div>}

      <DataTable
        data={rulesData}
        columns={columns}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        isLoading={isDataLoading}
        meta={{
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages,
        }}
        onChangePage={handlePageChange}
      />

      {/* Dialogs */}
      <RuleDetailsDialog
        ruleId={selectedRuleId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

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
    </div>
  );
}
