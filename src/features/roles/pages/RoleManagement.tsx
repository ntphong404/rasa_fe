import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { IRole } from "@/interfaces/role.interface";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpDown,
  Check,
  ChevronsUpDown,
  Command,
  Edit,
  Eye,
  Plus,
  SearchIcon,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRole } from "@/hooks/useRole";
import { ListRoleResponse, Role } from "../api/dto/RoleResponse";
import { Permission } from "@/features/permissions/api/dto/permissions.dto";
import { usePermission } from "@/hooks/usePermission";
import RoleDetailsDialog from "./RoleDetailsDialog";
import EditRoleDialog from "./EditRoleDialog";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

const filterSchema = z.object({
  search: z.string().optional(),
  deleted: z.boolean().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

// RoleDetailsDialog
interface RoleDetailsDialogProps {
  role: IRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// function RoleDetailsDialog({
//   role,
//   open,
//   onOpenChange,
// }: RoleDetailsDialogProps) {
//   const { t } = useTranslation();
//   //   const { fetchPermissions } = usePermissions();
//   //   const { fetchChatBots } = useChatBot();
//   //   const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
//   //   const [chatbotsList, setChatbotsList] = useState<ChatBot[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (open) {
//       setIsLoading(true);

//       const fetchData = async () => {
//         try {
//           const permissionQuery = new URLSearchParams({
//             page: "1",
//             limit: "100",
//           }).toString();
//             const permissionResponse = await fetchPermissions(
//               `?${permissionQuery}`
//             );
//             setPermissionsList(permissionResponse.data);

//             const chatbotQuery = new URLSearchParams({
//               page: "1",
//               limit: "100",
//             }).toString();
//             const chatbotResponse = await fetchChatBots(`?${chatbotQuery}`);
//             setChatbotsList(chatbotResponse.data);
//         } catch (error) {
//           console.error("Error fetching data:", error);
//         } finally {
//           setIsLoading(false);
//         }
//       };

//       fetchData();
//     }
//   }, [open]);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[80vh] overflow-y-auto p-4">
//         <DialogHeader>
//           <DialogTitle>{t("Role Details")}</DialogTitle>
//           <DialogDescription>
//             {t("Details for role")} {role?.name}
//           </DialogDescription>
//         </DialogHeader>
//         {isLoading ? (
//           <div className="text-sm text-muted-foreground">{t("Loading...")}</div>
//         ) : role ? (
//           <div className="space-y-4">
//             <div>
//               <strong>{t("Name")}:</strong> {role.name}
//             </div>
//             <div>
//               <strong>{t("Description")}:</strong>{" "}
//               {role.desc || t("No description")}
//             </div>
//             <div>
//               <strong>{t("Permissions")}:</strong>
//               {role.permissions.length > 0 ? (
//                 <ul className="list-disc pl-5">
//                   {role.permissions.map((permId) => (
//                     <li key={permId}>
//                       {permissionsList.find((p) => p._id === permId)
//                         ?.endPoint || permId}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 t("No permissions")
//               )}
//             </div>
//             <div>
//               <strong>{t("Chatbots")}:</strong>
//               {role.chatbots.length > 0 ? (
//                 <ul className="list-disc pl-5">
//                   {role.chatbots.map((chatbotId) => (
//                     <li key={chatbotId}>
//                       {chatbotsList.find((c) => c._id === chatbotId)?.name ||
//                         chatbotId}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 t("No chatbots")
//               )}
//             </div>
//             <div>
//               <strong>{t("Created At")}:</strong>{" "}
//               {new Date(role.createdAt).toLocaleString()}
//             </div>
//             <div>
//               <strong>{t("Updated At")}:</strong>{" "}
//               {new Date(role.updatedAt).toLocaleString()}
//             </div>
//             <div>
//               <strong>{t("Deleted")}:</strong>{" "}
//               {role.deleted ? t("Yes") : t("No")}
//             </div>
//           </div>
//         ) : (
//           <div className="text-sm text-muted-foreground">
//             {t("No role selected")}
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }

// Main RoleManagement Component
export function RoleManagement() {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState({});
  const [rolesData, setRolesData] = useState<Role[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  //   const {
  //     fetchRoles,
  //     createRole,
  //     updateRole,
  //     deleteRole,
  //     isLoading,
  //     error: rolesError,
  //   } = useRoles();
  //   const { fetchPermissions } = usePermissions();
  //   const { fetchChatBots } = useChatBot();
  //   const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  //   const [chatbotsList, setChatbotsList] = useState<ChatBot[]>([]);
  //   const [
  //     isDataLoadingPermissionsChatbots,
  //     setIsDataLoadingPermissionsChatbots,
  //   ] = useState(false);

  //   useEffect(() => {
  //     setIsDataLoadingPermissionsChatbots(true);

  //     const fetchData = async () => {
  //       try {
  //         const permissionQuery = new URLSearchParams({
  //           page: "1",
  //           limit: "100",
  //         }).toString();
  //         const permissionResponse = await fetchPermissions(
  //           `?${permissionQuery}`
  //         );
  //         setPermissionsList(permissionResponse.data);

  //         const chatbotQuery = new URLSearchParams({
  //           page: "1",
  //           limit: "100",
  //         }).toString();
  //         const chatbotResponse = await fetchChatBots(`?${chatbotQuery}`);
  //         setChatbotsList(chatbotResponse.data);
  //       } catch (error) {
  //         console.error("Error fetching data:", error);
  //       } finally {
  //         setIsDataLoadingPermissionsChatbots(false);
  //       }
  //     };

  //     fetchData();
  //   }, []);

  const { fetchRoles, errorRole, deleteRole } = useRole();
  const { fetchPermissions } = usePermission();

  const [
    isDataLoadingPermissionsChatbots,
    setIsDataLoadingPermissionsChatbots,
  ] = useState(false);
  useEffect(() => {
    setIsDataLoadingPermissionsChatbots(true);
    fetchPermissions("?page=1&limit=100")
      .then((res) => {
        setPermissionsList(res.data);
      })
      .catch((error) => {
        console.error("Error fetching permissions:", error);
      })
      .finally(() => {
        setIsDataLoadingPermissionsChatbots(false);
      });
  }, []);

  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: "",
      deleted: false,
      page: 1,
      limit: 10,
    },
  });

  const fetchRolesData = async (
    page: number,
    limit: number,
    search?: string,
    deleted?: boolean
  ) => {
    try {
      setIsDataLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(deleted !== undefined && { deleted: deleted.toString() }),
      }).toString();

      const response: ListRoleResponse = await fetchRoles(`?${query}`);
      if (response.success && Array.isArray(response.data)) {
        setRolesData(response.data);
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
        `Failed to fetch roles: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Error fetching roles:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    fetchRolesData(
      pagination.page,
      pagination.limit,
      form.getValues("search"),
      form.getValues("deleted")
    );
  }, [pagination.page, pagination.limit]);

  const onSubmit = (data: z.infer<typeof filterSchema>) => {
    fetchRolesData(
      1,
      data.limit || pagination.limit,
      data.search,
      data.deleted
    );
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleAskDeleteRole = (id: string) => {
    setRoleToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      try {
        await deleteRole(roleToDelete);
        setRoleToDelete(null);
        setConfirmDeleteOpen(false);
        fetchRolesData(
          pagination.page,
          pagination.limit,
          form.getValues("search"),
          form.getValues("deleted")
        );
      } catch (error) {
        console.error("Lỗi xóa role:", error);
      }
    }
  };

  const handleViewDetails = (role: Role) => {
    setSelectedRole(role);
    setDetailsDialogOpen(true);
  };

  const refreshRoles = () => {
    fetchRolesData(
      1,
      pagination.limit,
      form.getValues("search"),
      form.getValues("deleted")
    );
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
                        placeholder={t("Search roles")}
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
            {/* <DrawerTrigger asChild>
              <Button className="bg-blue-600">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <span>{t("Filter")}</span>
              </Button>
            </DrawerTrigger> */}
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>{t("Filter Roles")}</DrawerTitle>
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
                              id="role-filter-deleted"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="role-filter-deleted"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t("Show deleted roles")}
                            </label>
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
                                          // onSelect={() => {
                                          //   form.setValue("limit", limit);
                                          //   form.handleSubmit(onSubmit)();
                                          // }}
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
                              {t("roles / page")}
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
            {t("Create Role")}
          </Button>
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <FileCode2 className="mr-2 h-4 w-4" />
                <span>{t("Features")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Paperclip className="mr-2 h-4 w-4" />
                {t("Import Roles")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileDown className="mr-2 h-4 w-4" />
                {t("Export Roles")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </form>
      </Form>

      {error || errorRole ? (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-2">{t("Error loading roles")}</div>
          <div className="text-sm text-muted-foreground">
            {error || errorRole}
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
                  {t("Role Name")}
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
                <div className="text-sm text-muted-foreground">
                  {row.getValue("description") || t("No description")}
                </div>
              ),
            },
            {
              accessorKey: "permissions",
              header: t("Permissions"),
              cell: ({ row }) => {
                const permissions = row.getValue("permissions") as string[];
                const permCount = permissions.length;

                return (
                  <div className="text-sm">
                    {isDataLoadingPermissionsChatbots ? (
                      t("Loading...")
                    ) : permCount > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            {t("{{count}} Permissions", {
                              count: permCount,
                            })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80 max-h-[300px] overflow-y-auto p-0"
                          align="start"
                        >
                          <div className="p-4">
                            <h4 className="font-medium mb-2">
                              {t("Permissions")}
                            </h4>
                            <div className="space-y-2">
                              {permissions.map((permId) => {
                                console.log("list permission", permissionsList);

                                const permission = permissionsList.find(
                                  (p) => p._id === permId
                                );
                                console.log("permission", permission);

                                return (
                                  <div
                                    key={permId}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        permission?.method === "GET"
                                          ? "bg-blue-100 text-blue-700"
                                          : permission?.method === "POST"
                                          ? "bg-green-100 text-green-700"
                                          : permission?.method === "PUT"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : permission?.method === "DELETE"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {permission?.method || ""}
                                    </span>
                                    <span
                                      className="truncate max-w-[200px]"
                                      title={permission?.originalUrl || permId}
                                    >
                                      {permission?.originalUrl || permId}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      t("No permissions")
                    )}
                  </div>
                );
              },
            },

            // {
            //   accessorKey: "chatbots",
            //   header: t("Chatbots"),
            //   cell: ({ row }) => {
            //     const chatbots = row.getValue("chatbots") as string[];
            //     const chatbotCount = chatbots.length;

            //     return (
            //       <div className="text-sm">
            //         {
            //           //isDataLoadingPermissionsChatbots
            //           true ? ( // fake
            //             t("Loading...")
            //           ) : chatbotCount > 0 ? (
            //             <Popover>
            //               <PopoverTrigger asChild>
            //                 <Button variant="outline" size="sm" className="h-8">
            //                   {t("{{count}} Chatbots", {
            //                     count: chatbotCount,
            //                   })}
            //                 </Button>
            //               </PopoverTrigger>
            //               <PopoverContent
            //                 className="w-60 max-h-[300px] overflow-y-auto p-0"
            //                 align="start"
            //               >
            //                 <div className="p-4">
            //                   <h4 className="font-medium mb-2">
            //                     {t("Chatbots")}
            //                   </h4>
            //                   <div className="space-y-2">
            //                     {/* {chatbots.map((chatbotId) => {
            //                     const chatbot = chatbotsList.find(
            //                       (c) => c._id === chatbotId
            //                     );
            //                     return (
            //                       <div key={chatbotId} className="text-sm">
            //                         {chatbot?.name || chatbotId}
            //                       </div>
            //                     );
            //                   })} */}
            //                   </div>
            //                 </div>
            //               </PopoverContent>
            //             </Popover>
            //           ) : (
            //             t("No chatbots")
            //           )
            //         }
            //       </div>
            //     );
            //   },
            // },
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
              cell: ({ row }) => (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewDetails(row.original)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleEditRole(row.original)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleAskDeleteRole(row.original._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
          data={rolesData}
          meta={pagination}
          onChangePage={handlePageChange}
          isLoading={isDataLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
      )}

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onRoleCreated={refreshRoles}
      />

      <EditRoleDialog
        role={selectedRole}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onRoleUpdated={refreshRoles}
      />

      <RoleDetailsDialog
        role={selectedRole}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleConfirmDelete}
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
