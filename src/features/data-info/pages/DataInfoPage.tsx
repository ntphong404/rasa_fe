import React, { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { IRule } from "@/interfaces/rule.interface";
import { ruleService } from "@/features/rules/api/service";
import { ListRuleResponse } from "@/features/rules/api/dto/RuleResponse";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import {
    Eye,
    Trash2,
    RotateCcw,
} from "lucide-react";
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
    const [rulesData, setRulesData] = useState<IRule[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmSoftDeleteOpen, setConfirmSoftDeleteOpen] = useState(false);
    const [confirmHardDeleteOpen, setConfirmHardDeleteOpen] = useState(false);
    const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<IRule | null>(null);
    const [ruleToRestore, setRuleToRestore] = useState<IRule | null>(null);
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

    const fetchRulesData = useCallback(
        async (query: any) => {
            try {
                setIsDataLoading(true);
                setError(null);
                const response: ListRuleResponse = await ruleService.fetchRules(query);
                setRulesData(response.data || []);
                setPagination(
                    response.meta || { total: 0, page: 1, limit: 10, totalPages: 1 }
                );
            } catch (error) {
                console.error("Error fetching rules:", error);
                setError("Không tải được dữ liệu");
                setRulesData([]);
            } finally {
                setIsDataLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const subscription = form.watch(() => {
            const values = form.getValues();
            fetchRulesData(values);
        });
        return () => subscription.unsubscribe();
    }, [form, fetchRulesData]);

    useEffect(() => {
        fetchRulesData({ page: 1, limit: 10, deleted: false, sort: "DESC" });
    }, [fetchRulesData]);

    const onSubmit = (values: z.infer<typeof filterSchema>) => {
        fetchRulesData(values);
    };

    const handlePageChange = (page: number) => {
        form.setValue("page", page);
    };

    const handleViewDetails = (rule: IRule) => {
        navigate(`/data-info/view?id=${rule._id}`);
    };

    // Edit button removed for Data Info view per product request

    const handleAskDeleteRule = (rule: IRule) => {
        setRuleToDelete(rule);
        if (rule.deleted) {
            setConfirmHardDeleteOpen(true);
        } else {
            setConfirmSoftDeleteOpen(true);
        }
    };

    const handleAskRestoreRule = (rule: IRule) => {
        setRuleToRestore(rule);
        setConfirmRestoreOpen(true);
    };

    const handleConfirmSoftDelete = async () => {
        if (ruleToDelete) {
            try {
                await ruleService.softDeleteRule(ruleToDelete._id);
                toast.success(t("Rule moved to trash"));
                const currentValues = form.getValues();
                fetchRulesData(currentValues);
            } catch (error) {
                console.error("Error deleting rule:", error);
                toast.error(t("Failed to delete rule"));
            }
        }
    };

    const handleConfirmHardDelete = async () => {
        if (ruleToDelete) {
            try {
                await ruleService.hardDeleteRule(ruleToDelete._id);
                toast.success(t("Rule deleted permanently"));
                const currentValues = form.getValues();
                fetchRulesData(currentValues);
            } catch (error) {
                console.error("Error deleting rule:", error);
                toast.error(t("Failed to delete rule"));
            }
        }
    };

    const handleConfirmRestore = async () => {
        if (ruleToRestore) {
            try {
                await ruleService.restoreRule(ruleToRestore._id);
                toast.success(t("Rule restored"));
                const currentValues = form.getValues();
                fetchRulesData(currentValues);
            } catch (error) {
                console.error("Error restoring rule:", error);
                toast.error(t("Failed to restore rule"));
            }
        }
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
                    <Button onClick={() => fetchRulesData({ page: 1, limit: 10, deleted: false, sort: "DESC" })} className="mt-4">{t("Retry")}</Button>
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
                                const rule = row.original as IRule;
                                const isDeleted = rule.deleted || false;
                                return <span className={cn("font-medium", isDeleted && "line-through text-muted-foreground")}>{rule.name}</span>;
                            },
                        },
                        {
                            accessorKey: "description",
                            header: t("Description"),
                            cell: ({ row }) => <span className="text-sm text-muted-foreground">{(row.original as IRule).description || "-"}</span>,
                        },
                        {
                            accessorKey: "intents",
                            header: t("Intents"),
                            cell: ({ row }) => {
                                const rule = row.original as IRule;
                                const intentsCount = Array.isArray(rule.intents) ? rule.intents.length : 0;
                                return <span className="text-sm">{intentsCount > 0 ? `${intentsCount} ${t("intents")}` : t("No intents")}</span>;
                            },
                        },
                        {
                            accessorKey: "action",
                            header: t("Actions"),
                            cell: ({ row }) => {
                                const rule = row.original as IRule;
                                const actionsCount = Array.isArray(rule.action) ? rule.action.length : 0;
                                return <span className="text-sm">{actionsCount > 0 ? `${actionsCount} ${t("actions")}` : t("No actions")}</span>;
                            },
                        },
                        {
                            accessorKey: "responses",
                            header: t("Responses"),
                            cell: ({ row }) => {
                                const rule = row.original as IRule;
                                const responsesCount = Array.isArray(rule.responses) ? rule.responses.length : 0;
                                return <span className="text-sm">{responsesCount > 0 ? `${responsesCount} ${t("responses")}` : t("No responses")}</span>;
                            },
                        },
                        {
                            accessorKey: "createdAt",
                            header: ({ column }) => (
                                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                                    {t("Created At")}
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            ),
                            cell: ({ row }) => <span className="text-sm">{new Date((row.original as IRule).createdAt).toLocaleDateString()}</span>,
                        },
                        {
                            id: "actions",
                            header: t("Operations"),
                            cell: ({ row }) => {
                                const rule = row.original as IRule;
                                const isDeleted = rule.deleted || false;

                                return (
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleViewDetails(rule)} size="sm" className="bg-green-600 hover:bg-green-700">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {/* Edit button intentionally removed for Data Info (non-technical view) */}
                                        {isDeleted ? (
                                            <>
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAskRestoreRule(rule)} title={t("Restore from trash")}>
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" className="bg-red-700 hover:bg-red-800" onClick={() => handleAskDeleteRule(rule)} title={t("Delete permanently")}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleAskDeleteRule(rule)} title={t("Move to trash")}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={rulesData}
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
