import React, { useEffect, useState, useCallback } from "react";
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
    ChevronsUpDown,
    SearchIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { IStory } from "@/interfaces/story.interface";
import { storyService } from "@/features/stories/api/service";
import { ListStoryResponse } from "@/features/stories/api/dto/StoryDto";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import {
    Eye,
    Trash2,
    RotateCcw,
} from "lucide-react";
import StoryDetailsDialog from "@/features/stories/components/StoryDetailsDialog";
import { ConfirmSoftDeleteDialog, ConfirmHardDeleteDialog } from "@/components/confirm-delete-dialog";
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

export default function DataInfoPage() {
    const { t } = useTranslation();
    const [rowSelection, setRowSelection] = useState({});
    const [storiesData, setStoriesData] = useState<IStory[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
    const [confirmSoftDeleteOpen, setConfirmSoftDeleteOpen] = useState(false);
    const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
    const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
    const [storyToDelete, setStoryToDelete] = useState<IStory | null>(null);
    const [storyToRestore, setStoryToRestore] = useState<IStory | null>(null);
    const navigate = useNavigate();

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

    const fetchStoriesData = useCallback(
        async (query: any) => {
            try {
                setIsDataLoading(true);
                setError(null);
                const response: ListStoryResponse = await storyService.fetchStories(query);
                setStoriesData(response.data || []);
                setPagination(
                    response.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }
                );
            } catch (error) {
                console.error("Error fetching stories:", error);
                setError("Không tải được dữ liệu");
                setStoriesData([]);
            } finally {
                setIsDataLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const subscription = form.watch(() => {
            const values = form.getValues();
            fetchStoriesData(values);
        });
        return () => subscription.unsubscribe();
    }, [form, fetchStoriesData]);

    useEffect(() => {
        fetchStoriesData({ page: 1, limit: 10, deleted: false, sort: "DESC" });
    }, [fetchStoriesData]);

    const onSubmit = (values: z.infer<typeof filterSchema>) => {
        fetchStoriesData(values);
    };

    const handlePageChange = (page: number) => {
        form.setValue("page", page);
    };

    const handleViewDetails = (story: IStory) => {
        navigate(`/data-info/view?id=${story._id}`);
    };

    // Edit button removed for Data Info view per product request

    const handleAskDeleteStory = (story: IStory) => {
        setStoryToDelete(story);
        if (story.deleted) {
            setConfirmHardDeleteOpen(true);
        } else {
            setConfirmSoftDeleteOpen(true);
        }
    };

    const handleAskRestoreStory = (story: IStory) => {
        setStoryToRestore(story);
        setConfirmRestoreOpen(true);
    };

    const handleConfirmSoftDelete = async () => {
        if (storyToDelete) {
            try {
                await storyService.softDeleteStory(storyToDelete._id);
                toast.success(t("Story moved to trash"));
                const currentValues = form.getValues();
                fetchStoriesData(currentValues);
            } catch (error) {
                console.error("Error deleting story:", error);
                toast.error(t("Failed to delete story"));
            }
        }
    };

    const handleConfirmHardDelete = async () => {
        if (storyToDelete) {
            try {
                await storyService.hardDeleteStory(storyToDelete._id);
                toast.success(t("Story deleted permanently"));
                const currentValues = form.getValues();
                fetchStoriesData(currentValues);
            } catch (error) {
                console.error("Error deleting story:", error);
                toast.error(t("Failed to delete story"));
            }
        }
    };

    const handleConfirmRestore = async () => {
        if (storyToRestore) {
            try {
                await storyService.restoreStory(storyToRestore._id);
                toast.success(t("Story restored"));
                const currentValues = form.getValues();
                fetchStoriesData(currentValues);
            } catch (error) {
                console.error("Error restoring story:", error);
                toast.error(t("Failed to restore story"));
            }
        }
    };

    return (
        <div className="relative">
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
                                        <Input {...field} placeholder={t("Search...")} className="pl-10" />
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" variant="outline" className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white">
                        {t("Search")}
                    </Button>

                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <ChevronsUpDown className="h-4 w-4" />
                                {t("Filters")}
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <div className="mx-auto w-full max-w-sm">
                                <DrawerHeader>
                                    <DrawerTitle>{t("Filter Options")}</DrawerTitle>
                                </DrawerHeader>
                                <div className="p-4 pb-0 space-y-4">
                                    {/* deleted */}
                                    <FormField
                                        control={form.control}
                                        name="deleted"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="deleted" checked={field.value} onCheckedChange={field.onChange} />
                                                        <label htmlFor="deleted" className="text-sm font-medium leading-none">{t("Show deleted")}</label>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* limit */}
                                    <FormField
                                        control={form.control}
                                        name="limit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">{t("Items / page")}</label>
                                                        </div>
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
                    {/* Create button intentionally removed for Data Info view */}
                </form>
            </Form>

            {error ? (
                <div className="p-8 text-center">
                    <p className="text-red-500">{error}</p>
                    <Button onClick={() => fetchStoriesData({ page: 1, limit: 10, deleted: false, sort: "DESC" })} className="mt-4">{t("Retry")}</Button>
                </div>
            ) : (
                <DataTable
                    columns={[
                        {
                            id: "select",
                            header: ({ table }) => (
                                <Checkbox
                                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                                    aria-label="Select all"
                                />
                            ),
                            cell: ({ row }) => (
                                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
                            ),
                            enableSorting: false,
                            enableHiding: false,
                        },
                        {
                            accessorKey: "name",
                            header: ({ column }) => (
                                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                                    {t("Name")}
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            ),
                            cell: ({ row }) => {
                                const story = row.original as IStory;
                                const isDeleted = story.deleted || false;
                                return <span className={cn("font-medium", isDeleted && "line-through text-muted-foreground")}>{story.name}</span>;
                            },
                        },
                        {
                            accessorKey: "description",
                            header: t("Description"),
                            cell: ({ row }) => <span className="text-sm text-muted-foreground">{(row.original as IStory).description || "-"}</span>,
                        },
                        {
                            accessorKey: "intents",
                            header: t("Intents"),
                            cell: ({ row }) => {
                                const story = row.original as IStory;
                                const intentsCount = Array.isArray(story.intents) ? story.intents.length : 0;
                                return <span className="text-sm">{intentsCount > 0 ? `${intentsCount} intent${intentsCount > 1 ? "s" : ""}` : t("Không có intent")}</span>;
                            },
                        },
                        {
                            accessorKey: "action",
                            header: t("Actions"),
                            cell: ({ row }) => {
                                const story = row.original as IStory;
                                const actionsCount = Array.isArray(story.action) ? story.action.length : 0;
                                return <span className="text-sm">{actionsCount > 0 ? `${actionsCount} action${actionsCount > 1 ? "s" : ""}` : t("Không có action")}</span>;
                            },
                        },
                        {
                            accessorKey: "responses",
                            header: t("Responses"),
                            cell: ({ row }) => {
                                const story = row.original as IStory;
                                const responsesCount = Array.isArray(story.responses) ? story.responses.length : 0;
                                return <span className="text-sm">{responsesCount > 0 ? `${responsesCount} phản hồi` : t("Không có phản hồi")}</span>;
                            },
                        },
                        {
                            accessorKey: "createdAt",
                            header: ({ column }) => (
                                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                                    {t("Tạo lúc")}
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            ),
                            cell: ({ row }) => <span className="text-sm">{new Date((row.original as IStory).createdAt).toLocaleDateString("vi-VN")}</span>,
                        },
                        {
                            id: "actions",
                            header: t("Thao tác"),
                            cell: ({ row }) => {
                                const story = row.original as IStory;
                                const isDeleted = story.deleted || false;

                                return (
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleViewDetails(story)} size="sm" className="bg-green-600 hover:bg-green-700">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {/* Edit button intentionally removed for Data Info (non-technical view) */}
                                        {isDeleted ? (
                                            <>
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAskRestoreStory(story)} title={t("Restore from trash")}>
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" className="bg-red-700 hover:bg-red-800" onClick={() => handleAskDeleteStory(story)} title={t("Delete permanently")}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleAskDeleteStory(story)} title={t("Move to trash")}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={storiesData}
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

            {/* Details dialog replaced by dedicated detail page */}
        </div>
    );
}
