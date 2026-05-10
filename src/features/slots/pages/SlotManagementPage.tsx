import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SearchIcon, SlidersHorizontal, Plus, Eye, Edit, Trash2, Archive, RotateCcw } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ConfirmHardDeleteDialog, ConfirmSoftDeleteDialog } from "@/components/confirm-delete-dialog";
import { ConfirmRestoreDialog } from "@/components/confirm-restore-dialog";
import { SlotDetailsDialog } from "../components/SlotDetailsDialog";

import { useChatbotStore } from "@/store/chatbot";
import { useChatbots } from "@/hooks/useChatbots";
import { ISlot } from "@/interfaces/slot.interface";
import { slotService } from "../api/service";
import { ListSlotResponse } from "../api/dto/SlotResponse";
import { SlotQuery } from "../api/dto/SlotQuery";

const filterSchema = z.object({
  search: z.string().optional(),
  botId: z.string().optional(),
  deleted: z.string().optional(),
  sort: z.enum(['ASC', 'DESC']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

const formatDate = (value?: string | Date) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

const shorten = (value?: string | null) => {
  if (!value) return "-";
  return value.length > 10 ? `${value.slice(0, 10)}...` : value;
};

export function SlotManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const refreshTrigger = useChatbotStore((state) => state.refreshTrigger);
  const { chatbots } = useChatbots();

  const [slotsData, setSlotsData] = useState<ISlot[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmSoftDeleteOpen, setConfirmSoftDeleteOpen] = useState(false);
  const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<ISlot | null>(null);
  const [slotToRestore, setSlotToRestore] = useState<ISlot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ISlot | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});

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
      botId: "",
      deleted: "all",
      sort: "DESC",
      page: 1,
      limit: 10,
    },
  });

  const effectiveBotId = selectedBotId && selectedBotId !== "global" ? selectedBotId : undefined;

  const botNameMap = useMemo(
    () => new Map(chatbots.map((bot) => [bot.botId, bot.name])),
    [chatbots]
  );

  const deletedValueToBoolean = (value?: string) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  };

  const fetchSlotsData = async (filters?: SlotQuery) => {
    try {
      setIsDataLoading(true);

      const queryParams: SlotQuery = filters || {
        page: pagination.page,
        limit: pagination.limit,
        search: form.getValues("search"),
        botId: form.getValues("botId") || effectiveBotId,
        deleted: deletedValueToBoolean(form.getValues("deleted")),
        sort: form.getValues("sort"),
      };

      const response: ListSlotResponse = await slotService.fetchSlots(queryParams);

      if (response.success && Array.isArray(response.data)) {
        setSlotsData(response.data);
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
      setError(`Failed to fetch slots: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error fetching slots:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, refreshTrigger, selectedBotId]);

  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSlotsData({
      page: 1,
      limit: data.limit || pagination.limit,
      search: data.search,
      botId: data.botId || effectiveBotId,
      deleted: deletedValueToBoolean(data.deleted),
      sort: data.sort,
    });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleCreateSlot = () => {
    navigate("/slots/new");
  };

  const handleViewSlot = (slot: ISlot) => {
    setSelectedSlot(slot);
    setDetailsOpen(true);
  };

  const handleEditSlot = (slot: ISlot) => {
    navigate("/slots/edit", { state: { slot } });
  };

  const handleAskDeleteSlot = (slot: ISlot) => {
    setSlotToDelete(slot);
    if (slot.deleted) {
      setConfirmHardDeleteOpen(true);
    } else {
      setConfirmSoftDeleteOpen(true);
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!slotToDelete) return;
    await slotService.softDeleteSlot(slotToDelete._id);
    setSlotToDelete(null);
    setConfirmSoftDeleteOpen(false);
    fetchSlotsData();
  };

  const handleConfirmHardDelete = async () => {
    if (!slotToDelete) return;
    await slotService.hardDeleteSlot(slotToDelete._id);
    setSlotToDelete(null);
    setConfirmHardDeleteOpen(false);
    fetchSlotsData();
  };

  const handleAskRestoreSlot = (slot: ISlot) => {
    setSlotToRestore(slot);
    setConfirmRestoreOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!slotToRestore) return;
    await slotService.restoreSlot(slotToRestore._id);
    setSlotToRestore(null);
    setConfirmRestoreOpen(false);
    fetchSlotsData();
  };

  const columns = useMemo<ColumnDef<ISlot>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
        header: t("Name"),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "botIds",
        header: t("slotpage-column-chatbots"),
        cell: ({ row }) => {
          const botIds = row.original.botIds || [];
          if (!botIds.length) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {botIds.map((botId) => (
                <Badge key={botId} variant="secondary">
                  {botNameMap.get(botId) || botId}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "deleted",
        header: t("Status"),
        cell: ({ row }) => (
          row.original.deleted ? (
            <Badge variant="destructive" className="bg-red-600 text-white hover:bg-red-700">
              {t("Deleted")}
            </Badge>
          ) : (
            <Badge variant="secondary">{t("Active")}</Badge>
          )
        ),
      },
      {
        accessorKey: "updatedAt",
        header: t("Updated"),
        cell: ({ row }) => <span>{formatDate(row.original.updatedAt)}</span>,
      },
      {
        id: "actions",
        header: t("Actions"),
        cell: ({ row }) => {
          const slot = row.original;
          return (
            <div className="flex gap-2">
              <Button
                onClick={() => handleViewSlot(slot)}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                title={t("View details")}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {!slot.deleted && (
                <Button
                  onClick={() => handleEditSlot(slot)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  title={t("Edit")}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {slot.deleted ? (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleAskRestoreSlot(slot)}
                    title={t("Restore from trash")}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-700 hover:bg-red-800"
                    onClick={() => handleAskDeleteSlot(slot)}
                    title={t("Delete permanently")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleAskDeleteSlot(slot)}
                  title={t("Move to trash")}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [botNameMap, t]
  );

  return (
    <div className="admin-page">
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
                        id="search"
                        type="search"
                        placeholder={t("slotpage-search-placeholder")}
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
            {t("Search")}
          </Button>

          <Drawer>
            <DrawerTrigger asChild>
              <Button type="button" variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {t("Filter")}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-md">
                <DrawerHeader>
                  <DrawerTitle>{t("slotpage-filter-title")}</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-4 p-4">
                  <FormField
                    control={form.control}
                    name="botId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t("Chatbot")}</label>
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <option value="">{t("slotpage-filter-all-chatbots")}</option>
                              {chatbots.map((bot) => (
                                <option key={bot._id} value={bot.botId}>
                                  {bot.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deleted"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t("slotpage-filter-deleted-state")}</label>
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={field.value || "all"}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <option value="all">{t("All")}</option>
                              <option value="false">{t("slotpage-filter-active-only")}</option>
                              <option value="true">{t("slotpage-filter-deleted-only")}</option>
                            </select>
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
                            <label className="text-sm font-medium">{t("Sort")}</label>
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={field.value || "DESC"}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <option value="DESC">{t("Newest first")}</option>
                              <option value="ASC">{t("slotpage-filter-oldest-first")}</option>
                            </select>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <DrawerFooter>
                  <Button type="button" onClick={form.handleSubmit(onSubmit)}>{t("Apply")}</Button>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>

          <div className="flex-1"></div>
          <Button type="button" onClick={handleCreateSlot} variant="default" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            {t("slotpage-create-button")}
          </Button>
        </form>
      </Form>

      {error ? <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <DataTable
        columns={columns}
        data={slotsData}
        meta={pagination}
        onChangePage={handlePageChange}
        isLoading={isDataLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />

      <ConfirmSoftDeleteDialog
        open={confirmSoftDeleteOpen}
        onOpenChange={setConfirmSoftDeleteOpen}
        onConfirm={handleConfirmSoftDelete}
        title={t("slotpage-dialog-delete-title")}
        description={t("slotpage-dialog-delete-description")}
      />
      <ConfirmHardDeleteDialog
        open={confirmHardDeleteOpen}
        onOpenChange={setConfirmHardDeleteOpen}
        onConfirm={handleConfirmHardDelete}
        title={t("slotpage-dialog-hard-delete-title")}
        description={t("slotpage-dialog-hard-delete-description")}
      />
      <ConfirmRestoreDialog
        open={confirmRestoreOpen}
        onOpenChange={setConfirmRestoreOpen}
        onConfirm={handleConfirmRestore}
        title={t("slotpage-dialog-restore-title")}
        description={t("slotpage-dialog-restore-description")}
      />

      <SlotDetailsDialog
        slot={selectedSlot}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        botNameMap={botNameMap}
      />
    </div>
  );
}