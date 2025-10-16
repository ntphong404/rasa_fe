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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { chatBotService } from "../api/service";
import { ChatBot, ListChatBotResponse } from "../api/dto/ChatBotResponse";
import { ConfirmSoftDeleteDialog, ConfirmHardDeleteDialog } from "@/components/confirm-delete-dialog";
import { ConfirmRestoreDialog } from "@/components/confirm-restore-dialog";
import { Command } from "@/components/ui/command";
import { ChatBotDetailsDialog } from "../components/ChatBotDetailsDialog";
import { EditChatBotDialog } from "../pages/EditChatBotPage";
import { ChatBotOperationsDialog } from "../components/ChatBotOperationsDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const filterSchema = z.object({
  search: z.string().optional(),
  deleted: z.boolean().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sort: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const createChatBotSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  ip: z.string().min(1, { message: "IP address is required" }),
  rasaPort: z.number().min(1, { message: "Rasa port is required" }),
  flaskPort: z.number().min(1, { message: "Flask port is required" }),
  roles: z.array(z.string()).default([]),
});

interface CreateChatBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatBotCreated: () => void;
}

function CreateChatBotDialog({
  open,
  onOpenChange,
  onChatBotCreated,
}: CreateChatBotDialogProps) {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof createChatBotSchema>>({
    resolver: zodResolver(createChatBotSchema),
    defaultValues: {
      name: "",
      ip: "",
      rasaPort: 5005,
      flaskPort: 5000,
      roles: [],
    },
  });

  const onSubmit = async (data: z.infer<typeof createChatBotSchema>) => {
    try {
      await chatBotService.createChatBot(data);
      onChatBotCreated();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating chatbot:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{t("Create ChatBot")}</DialogTitle>
          <DialogDescription>
            {t("Enter details for the new chatbot.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ChatBot Name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("Enter chatbot name")}
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("IP Address")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("Enter IP address (e.g., 192.168.1.100)")}
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rasaPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Rasa Port")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5005"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="flaskPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Flask Port")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit">{t("Create")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ChatBotManagement() {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [chatBotsData, setChatBotsData] = useState<ChatBot[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [confirmSoftDeleteOpen, setConfirmSoftDeleteOpen] = useState(false);
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [chatBotToDelete, setChatBotToDelete] = useState<ChatBot | null>(null);
  const [chatBotToRestore, setChatBotToRestore] = useState<ChatBot | null>(null);
  const [selectedChatBot, setSelectedChatBot] = useState<ChatBot | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [operationsDialogOpen, setOperationsDialogOpen] = useState(false);
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
  
  const handleEditChatBot = (chatBot: ChatBot) => {
    setSelectedChatBot(chatBot);
    setEditDialogOpen(true);
  };
  
  const fetchChatBotsData = async (filters?: z.infer<typeof filterSchema>) => {
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

      const response: ListChatBotResponse = await chatBotService.fetchChatBots(queryParams);

      if (response.success && Array.isArray(response.data)) {
        setChatBotsData(response.data);
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
        `Failed to fetch chatbots: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Error fetching chatbots:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchChatBotsData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchChatBotsData({
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

  const handleAskDeleteChatBot = (chatBot: ChatBot) => {
    setChatBotToDelete(chatBot);
    if (chatBot.deleted) {
      setConfirmHardDeleteOpen(true);
    } else {
      setConfirmSoftDeleteOpen(true);
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (chatBotToDelete) {
      try {
        await chatBotService.softDeleteChatBot(chatBotToDelete._id);
        setChatBotToDelete(null);
        setConfirmSoftDeleteOpen(false);
        fetchChatBotsData();
      } catch (error) {
        console.error("Error soft deleting chatbot:", error);
      }
    }
  };

  const handleConfirmHardDelete = async () => {
    if (chatBotToDelete) {
      try {
        await chatBotService.hardDeleteChatBot(chatBotToDelete._id);
        setChatBotToDelete(null);
        setConfirmHardDeleteOpen(false);
        fetchChatBotsData();
      } catch (error) {
        console.error("Error hard deleting chatbot:", error);
      }
    }
  };

  const handleAskRestoreChatBot = (chatBot: ChatBot) => {
    setChatBotToRestore(chatBot);
    setConfirmRestoreOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (chatBotToRestore) {
      try {
        await chatBotService.restoreChatBot(chatBotToRestore._id);
        setChatBotToRestore(null);
        setConfirmRestoreOpen(false);
        fetchChatBotsData();
      } catch (error) {
        console.error("Error restoring chatbot:", error);
      }
    }
  };

  const handleViewDetails = (chatBot: ChatBot) => {
    setSelectedChatBot(chatBot);
    setDetailsDialogOpen(true);
  };

  const refreshChatBots = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchChatBotsData({
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
    <div className="relative">
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
                        placeholder={t("Search chatbots")}
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
                  <DrawerTitle>{t("Filter ChatBots")}</DrawerTitle>
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
                              id="chatbot-filter-deleted"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="chatbot-filter-deleted"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t("Show deleted chatbots")}
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
                              {t("chatbots / page")}
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
            {t("Create ChatBot")}
          </Button>
        </form>
      </Form>

      {error ? (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-2">{t("Error loading chatbots")}</div>
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
                  {t("ChatBot Name")}
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
              accessorKey: "ip",
              header: t("IP Address"),
              cell: ({ row }) => (
                <div className="text-sm font-mono">
                  {row.getValue("ip")}
                </div>
              ),
            },
            {
              accessorKey: "rasaPort",
              header: t("Rasa Port"),
              cell: ({ row }) => (
                <div className="text-sm">
                  {row.getValue("rasaPort")}
                </div>
              ),
            },
            {
              accessorKey: "flaskPort",
              header: t("Flask Port"),
              cell: ({ row }) => (
                <div className="text-sm">
                  {row.getValue("flaskPort")}
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
                const chatBot = row.original;
                const isDeleted = chatBot.deleted;
                
                return (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewDetails(chatBot)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      title={t("View details")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!isDeleted && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedChatBot(chatBot);
                            setOperationsDialogOpen(true);
                          }}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          title={t("Operations")}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleEditChatBot(chatBot)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          title={t("Edit")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isDeleted ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAskRestoreChatBot(chatBot)}
                          title={t("Restore from trash")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-700 hover:bg-red-800"
                          onClick={() => handleAskDeleteChatBot(chatBot)}
                          title={t("Delete permanently")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleAskDeleteChatBot(chatBot)}
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
          data={chatBotsData}
          meta={pagination}
          onChangePage={handlePageChange}
          isLoading={isDataLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}

      <CreateChatBotDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onChatBotCreated={refreshChatBots}
      />

      <ChatBotDetailsDialog
        chatBot={selectedChatBot}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <EditChatBotDialog
        chatBot={selectedChatBot}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onChatBotUpdated={refreshChatBots}
      />

      <ChatBotOperationsDialog
        chatBot={selectedChatBot}
        open={operationsDialogOpen}
        onOpenChange={setOperationsDialogOpen}
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