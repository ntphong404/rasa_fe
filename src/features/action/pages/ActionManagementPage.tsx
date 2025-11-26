import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
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
  Code,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { IAction } from "@/interfaces/action.interface";
import { ListActionResponse } from "../api/dto/ActionResponse";
import { actionService } from "../api/service";
import CreateActionDialog from "../components/CreateActionDialog";
import UpdateActionDialog from "../components/UpdateActionDialog";
import {
  ConfirmSoftDeleteDialog,
  ConfirmHardDeleteDialog,
} from "@/components/confirm-delete-dialog";
import { ConfirmRestoreDialog } from "@/components/confirm-restore-dialog";

const filterSchema = z.object({
  search: z.string().optional(),
  deleted: z.boolean().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export function ActionManagement() {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [actionsData, setActionsData] = useState<IAction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States cho các Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // details dialog removed; view will open edit dialog instead
  const [confirmSoftDeleteOpen, setConfirmSoftDeleteOpen] = useState(false);
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  // States để lưu trữ action đang được thao tác
  const [actionToDelete, setActionToDelete] = useState<IAction | null>(null);
  const [actionToRestore, setActionToRestore] = useState<IAction | null>(null);
  const [selectedAction, setSelectedAction] = useState<IAction | null>(null);

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
      sort: "ASC",
    },
  });

  const fetchActionsData = async (filters?: z.infer<typeof filterSchema>) => {
    try {
      setIsDataLoading(true);
      const queryParams = filters || { ...pagination, ...form.getValues() };
      const response: ListActionResponse = await actionService.fetchActions(
        queryParams
      );

      if (response.success && Array.isArray(response.data)) {
        setActionsData(response.data);
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
        `Failed to fetch actions: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Error fetching actions:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchActionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchActionsData({ ...data, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleAskDeleteAction = (action: IAction) => {
    setActionToDelete(action);
    if (action.deleted) {
      setConfirmHardDeleteOpen(true);
    } else {
      setConfirmSoftDeleteOpen(true);
    }
  };

  const handleEditAction = (action: IAction) => {
    setSelectedAction(action);
    setEditDialogOpen(true);
  };

  const handleConfirmSoftDelete = async () => {
    if (actionToDelete) {
      await actionService.softDeleteAction(actionToDelete._id);
      setActionToDelete(null);
      setConfirmSoftDeleteOpen(false);
      fetchActionsData();
    }
  };

  const handleConfirmHardDelete = async () => {
    if (actionToDelete) {
      await actionService.hardDeleteAction(actionToDelete._id);
      setActionToDelete(null);
      setConfirmHardDeleteOpen(false);
      fetchActionsData();
    }
  };

  const handleAskRestoreAction = (action: IAction) => {
    setActionToRestore(action);
    setConfirmRestoreOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (actionToRestore) {
      await actionService.restoreAction(actionToRestore._id);
      setActionToRestore(null);
      setConfirmRestoreOpen(false);
      fetchActionsData();
    }
  };

  const handleViewDetails = (action: IAction) => {
    // Open the edit dialog to view details
    setSelectedAction(action);
    setEditDialogOpen(true);
  };

  const refreshActions = () => {
    fetchActionsData();
  };

  return (
    <div className="relative p-3">
      <Form {...form}>
        <form
          className="table-controller py-4 flex gap-4 flex-col sm:flex-row"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <FormField
              control={form.control}
              name="search"
              render={({ field }) => (
                <Input
                  placeholder={t("Search actions")}
                  className="w-full pl-8"
                  {...field}
                />
              )}
            />
          </div>
          <Button type="submit">
            <SearchIcon className="mr-2 h-4 w-4" />
            {t("Search")}
          </Button>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {t("Filter")}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>{t("Filter Actions")}</DrawerTitle>
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
                              id="entity-filter-deleted"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="entity-filter-deleted"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t("Show deleted entities")}
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
                                  {field.value === "DESC"
                                    ? t("Newest first")
                                    : field.value === "ASC"
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
                                        {
                                          value: "DESC",
                                          label: t("Newest first"),
                                        },
                                        {
                                          value: "ASC",
                                          label: t("Oldest first"),
                                        },
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
                              {t("actions / page")}
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
            onClick={() => setCreateDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("Create Action")}
          </Button>
        </form>
      </Form>

      {error ? (
        <div className="p-8 text-center text-red-500">
          {t("Error loading actions")}: {error}
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
              header: t("Action Name"),
              cell: ({ row }) => (
                <Button
                  variant="link"
                  onClick={() => handleViewDetails(row.original)}
                  className="p-0"
                >
                  {row.getValue("name")}
                </Button>
              ),
            },
            {
              accessorKey: "description",
              header: t("Description"),
              cell: ({ row }) => (
                <div className="text-sm text-muted-foreground max-w-md truncate">
                  {row.getValue("description") || t("No description")}
                </div>
              ),
            },
            {
              accessorKey: "define",
              header: t("Action Code"),
              cell: ({ row }) => {
                const define = row.getValue("define") as string;
                return (
                  <div>
                    {define ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Code className="mr-2 h-4 w-4" />
                            {t("View Code")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[600px] max-h-[500px] overflow-y-auto"
                          align="start"
                        >
                          <div className="p-2">
                            <h4 className="font-medium mb-2">
                              {t("Python Code")}
                            </h4>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto font-mono">
                              {define}
                            </pre>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("No definition")}
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              accessorKey: "createdAt",
              header: t("Created At"),
              cell: ({ row }) =>
                new Date(row.getValue("createdAt")).toLocaleString(),
            },
            {
              id: "actions",
              header: t("Actions"),
              cell: ({ row }) => {
                const action = row.original;
                const isDeleted = action.deleted;
                return (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewDetails(action)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!isDeleted && (
                      <Button
                        onClick={() => handleEditAction(action)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    {isDeleted ? (
                      <>
                        <Button
                          onClick={() => handleAskRestoreAction(action)}
                          size="sm"
                          variant="outline"
                          title={t("Restore")}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          onClick={() => handleAskDeleteAction(action)}
                          size="sm"
                          variant="destructive"
                          title={t("Delete permanently")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleAskDeleteAction(action)}
                        size="sm"
                        variant="outline"
                        title={t("Move to trash")}
                      >
                        <Archive className="h-4 w-4 text-orange-600" />
                      </Button>
                    )}
                  </div>
                );
              },
            },
          ]}
          data={actionsData}
          meta={pagination}
          onChangePage={handlePageChange}
          isLoading={isDataLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}

      <CreateActionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onActionCreated={refreshActions}
      />

      <UpdateActionDialog
        action={selectedAction}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onActionUpdated={refreshActions}
      />
      {/* Action details dialog intentionally omitted (not needed) */}
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
