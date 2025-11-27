import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Permission } from "@/features/permissions/api/dto/permissions.dto";
import { usePermission } from "@/hooks/usePermission";
import { useRole } from "@/hooks/useRole";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string(),
  permissions: z.array(z.string()),
  //   chatbots: z.array(z.string()),
});

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleCreated: () => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onRoleCreated,
}: CreateRoleDialogProps) {
  const { createRole } = useRole();
  const { fetchPermissions } = usePermission();
  //   const { fetchChatBots } = useChatBot();
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  //   const [chatbotsList, setChatbotsList] = useState<ChatBot[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<{
    [key: string]: Permission[];
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);

      const fetchData = async () => {
        try {
          const permissionQuery = new URLSearchParams({
            page: "1",
            limit: "100",
          }).toString();
          const permissionResponse = await fetchPermissions(
            `?${permissionQuery}`
          );
          const permissions = permissionResponse.data;
          setPermissionsList(permissions);

          // Group permissions by module
          const grouped = permissions.reduce(
            (acc: { [key: string]: Permission[] }, perm: Permission) => {
              const module = perm.module || "Other";
              if (!acc[module]) {
                acc[module] = [];
              }
              acc[module].push(perm);
              return acc;
            },
            {}
          );
          setGroupedPermissions(grouped);

          const chatbotQuery = new URLSearchParams({
            page: "1",
            limit: "100",
          }).toString();
          //   const chatbotResponse = await fetchChatBots(`?${chatbotQuery}`);
          //   setChatbotsList(chatbotResponse.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [open]);

  const form = useForm<{
    name: string;
    description: string;
    permissions: string[];
    // chatbots: string[];
  }>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
      //   chatbots: [],
    },
  });

  const onSubmit = async (data: {
    name: string;
    description: string;
    permissions: string[];
    // chatbots: string[];
  }) => {
    try {
      await createRole(data);
      onRoleCreated();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Lỗi tạo role:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b px-4 py-4">
          <DialogTitle className="text-xl font-bold text-indigo-900">Tạo vai trò mới</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 mt-1">
            Nhập thông tin chi tiết cho vai trò mới
          </DialogDescription>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto px-4 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">Tên vai trò</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tên vai trò"
                          {...field}
                          className="w-full border-2 border-slate-200 focus:border-indigo-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">Mô tả</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập mô tả vai trò"
                          {...field}
                          className="w-full border-2 border-slate-200 focus:border-indigo-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Quyền hạn</h3>
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-2">
                          {isLoading ? (
                            <div className="text-sm text-muted-foreground">
                              Đang tải...
                            </div>
                          ) : Object.keys(groupedPermissions).length > 0 ? (
                            <Accordion
                              type="multiple"
                              className="w-full border-2 border-slate-200 rounded-lg"
                            >
                            {Object.entries(groupedPermissions).map(
                              ([module, perms]) => (
                                  <AccordionItem
                                    value={module}
                                    key={module}
                                    className="border-b last:border-b-0"
                                  >
                                    <AccordionTrigger className="px-3 py-3 hover:bg-indigo-50/50 transition-colors">
                                      <div className="flex items-center justify-between w-full pr-4">
                                        <div className="font-semibold text-sm text-slate-800">
                                          Phân hệ: {module}
                                        </div>
                                        <div
                                          className="flex items-center gap-2"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-xs bg-indigo-50 px-2 py-1 rounded-full text-indigo-700 font-medium">
                                            {
                                              field.value.filter((id) =>
                                                perms.some((p) => p._id === id)
                                              ).length
                                            }
                                            /{perms.length}
                                          </span>
                                        <Switch
                                          checked={perms.every((perm) =>
                                            field.value.includes(perm._id)
                                          )}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              // Add all permissions from this module that aren't already included
                                              const permIdsToAdd = perms
                                                .filter(
                                                  (perm) =>
                                                    !field.value.includes(
                                                      perm._id
                                                    )
                                                )
                                                .map((perm) => perm._id);
                                              field.onChange([
                                                ...field.value,
                                                ...permIdsToAdd,
                                              ]);
                                            } else {
                                              // Remove all permissions from this module
                                              field.onChange(
                                                field.value.filter(
                                                  (id) =>
                                                    !perms.some(
                                                      (perm) => perm._id === id
                                                    )
                                                )
                                              );
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-3 pt-2">
                                      <div className="space-y-2">
                                        {perms.map((perm) => (
                                          <div
                                            key={perm._id}
                                            className="flex items-center justify-between p-2 border-2 border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-white"
                                          >
                                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                              <div className="text-xs text-slate-600 truncate">
                                                {perm.description || perm.originalUrl}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                    perm.method === "GET"
                                                      ? "bg-blue-100 text-blue-700"
                                                      : perm.method === "POST"
                                                      ? "bg-green-100 text-green-700"
                                                      : perm.method === "PUT"
                                                      ? "bg-yellow-100 text-yellow-700"
                                                      : perm.method === "DELETE"
                                                      ? "bg-red-100 text-red-700"
                                                      : "bg-gray-100 text-gray-700"
                                                  }`}
                                                >
                                                  {perm.method}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono truncate">{perm.originalUrl}</span>
                                              </div>
                                            </div>
                                            <div className="flex items-center ml-2">
                                              <Switch
                                              checked={field.value.includes(
                                                perm._id
                                              )}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  field.onChange([
                                                    ...field.value,
                                                    perm._id,
                                                  ]);
                                                } else {
                                                  field.onChange(
                                                    field.value.filter(
                                                      (id) => id !== perm._id
                                                    )
                                                  );
                                                }
                                              }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              )
                            )}
                          </Accordion>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Không có quyền hạn
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            {/* <FormField
              control={form.control}
              name="chatbots"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Chatbots")}</FormLabel>
                  <FormControl>
                    <div>
                      <Select
                        onValueChange={(value) => {
                          if (!field.value.includes(value)) {
                            field.onChange([...field.value, value]);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("Select chatbots")} />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoading ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              {t("Loading...")}
                            </div>
                          ) : chatbotsList.length > 0 ? (
                            chatbotsList.map((chatbot) => (
                              <SelectItem key={chatbot._id} value={chatbot._id}>
                                {chatbot.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              {t("No chatbots available")}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((chatbotId, index) => (
                          <div
                            key={chatbotId}
                            className="flex items-center bg-gray-100 px-2 py-1 rounded text-sm"
                          >
                            {chatbotsList.find((c) => c._id === chatbotId)
                              ?.name || chatbotId}
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(
                                  field.value.filter((id) => id !== chatbotId)
                                );
                              }}
                              className="ml-2"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            </div>
            <div className="border-t px-4 py-3 flex justify-end gap-2 bg-slate-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-2"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? "Đang tạo..." : "Tạo vai trò"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
