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
import { z } from "zod";
import { IMyResponse } from "@/interfaces/response.interface";
import { responseService } from "../api/service";
import { ListMyResponseResult } from "../api/dto/MyResponseResult";
import { ConfirmSoftDeleteDialog, ConfirmHardDeleteDialog } from "@/components/confirm-delete-dialog";
import { ConfirmRestoreDialog } from "@/components/confirm-restore-dialog";
import { Command } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import ResponseDetailsDialog from "../components/ResponseDetailsDialog";
// import CreateResponseDialog from "../components/CreateResponseDialog";
// import EditResponseDialog from "../components/EditResponseDialog";
import createMyReponseQuery from "../api/dto/MyReponseQuery";
import CreateResponseDialog from "../components/CreateResponseDialog";
import EditResponseDialog from "../components/EditResponseDialog";

const filterSchema = z.object({
  search: z.string().optional(),
  deleted: z.boolean().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export function ResponseManagement() {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [responsesData, setResponsesData] = useState<IMyResponse[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [confirmSoftDeleteOpen, setConfirmSoftDeleteOpen] = useState(false);
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<IMyResponse | null>(null);
  const [responseToRestore, setResponseToRestore] = useState<IMyResponse | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<IMyResponse | null>(null);

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

  const fetchResponsesData = async (filters?: z.infer<typeof filterSchema>) => {
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

      const queryString = createMyReponseQuery(queryParams);
      const response: ListMyResponseResult = await responseService.fetchResponses(queryString);

      if (response.success && Array.isArray(response.data)) {
        setResponsesData(response.data);
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
        `Failed to fetch responses: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Error fetching responses:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchResponsesData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchResponsesData({
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

  const handleAskDeleteResponse = (response: IMyResponse) => {
    setResponseToDelete(response);
    if (response.deleted) {
      setConfirmHardDeleteOpen(true);
    } else {
      setConfirmSoftDeleteOpen(true);
    }
  };

  const handleEditResponse = (response: IMyResponse) => {
    setSelectedResponse(response);
    setEditDialogOpen(true);
  };

  const handleConfirmSoftDelete = async () => {
    if (responseToDelete) {
      try {
        await responseService.softDeleteResponse(responseToDelete._id);
        setResponseToDelete(null);
        setConfirmSoftDeleteOpen(false);
        fetchResponsesData();
      } catch (error) {
        console.error("Error soft deleting response:", error);
      }
    }
  };

  const handleConfirmHardDelete = async () => {
    if (responseToDelete) {
      try {
        await responseService.hardDeleteResponse(responseToDelete._id);
        setResponseToDelete(null);
        setConfirmHardDeleteOpen(false);
        fetchResponsesData();
      } catch (error) {
        console.error("Error hard deleting response:", error);
      }
    }
  };

  const handleAskRestoreResponse = (response: IMyResponse) => {
    setResponseToRestore(response);
    setConfirmRestoreOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (responseToRestore) {
      try {
        await responseService.restoreResponse(responseToRestore._id);
        setResponseToRestore(null);
        setConfirmRestoreOpen(false);
        fetchResponsesData();
      } catch (error) {
        console.error("Error restoring response:", error);
      }
    }
  };

  const handleViewDetails = (response: IMyResponse) => {
    setSelectedResponse(response);
    setDetailsDialogOpen(true);
  };

  const refreshResponses = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchResponsesData({
      page: 1,
      limit: pagination.limit,
      search: form.getValues("search"),
      deleted: form.getValues("deleted"),
      sort: form.getValues("sort"),
      startDate: form.getValues("startDate"),
      endDate: form.getValues("endDate"),
    });
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
                        placeholder={t("Search responses")}
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
                  <DrawerTitle>{t("Filter Responses")}</DrawerTitle>
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
                              id="response-filter-deleted"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="response-filter-deleted"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t("Show deleted responses")}
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
                              {t("responses / page")}
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
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("Create Response")}
          </Button>
        </form>
      </Form>

      {error ? (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-2">{t("Error loading responses")}</div>
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
                  {t("Response Name")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              ),
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
              accessorKey: "roles",
              header: t("Roles"),
              cell: ({ row }) => {
                const roles = row.getValue("roles") as string[];
                
                return (
                  <div className="flex gap-1 flex-wrap">
                    {roles && roles.length > 0 ? (
                      roles.map((role, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">{t("No roles")}</span>
                    )}
                  </div>
                );
              },
            },
            {
              accessorKey: "define",
              header: t("Definition"),
              cell: ({ row }) => {
                const define = row.getValue("define") as string;
                const preview = define ? define.substring(0, 50) + (define.length > 50 ? "..." : "") : t("No definition");
                
                return (
                  <div className="text-sm">
                    {define ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            {t("View YAML")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[500px] max-h-[400px] overflow-y-auto"
                          align="start"
                        >
                          <div className="p-2">
                            <h4 className="font-medium mb-2">
                              {t("YAML Definition")}
                            </h4>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                              {define}
                            </pre>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-muted-foreground">{preview}</span>
                    )}
                  </div>
                );
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
                const response = row.original;
                const isDeleted = response.deleted;
                
                return (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewDetails(response)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!isDeleted && (
                      <Button
                        onClick={() => handleEditResponse(response)}
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
                          onClick={() => handleAskRestoreResponse(response)}
                          title={t("Restore from trash")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-700 hover:bg-red-800"
                          onClick={() => handleAskDeleteResponse(response)}
                          title={t("Delete permanently")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleAskDeleteResponse(response)}
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
          data={responsesData}
          meta={pagination}
          onChangePage={handlePageChange}
          isLoading={isDataLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}


      <CreateResponseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onResponseCreated={refreshResponses}
      />

      <EditResponseDialog
        response={selectedResponse}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onResponseUpdated={refreshResponses}
      />

       <ResponseDetailsDialog
        response={selectedResponse}
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