import { z } from "zod";
import { Permission } from "../api/dto/permissions.dto";
import { usePermission } from "@/hooks/usePermission";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

// EditPermissionDialog
const editPermissionSchema = z.object({
  method: z.string().min(1, { message: "Method is required" }),
  originalUrl: z.string().min(1, { message: "Original URL is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  module: z.string().min(1, { message: "Module is required" }),
  isPublic: z.boolean(),
});

interface EditPermissionDialogProps {
  permission: Permission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionUpdated: () => void;
}

export function EditPermissionDialog({
  permission,
  open,
  onOpenChange,
  onPermissionUpdated,
}: EditPermissionDialogProps) {
  const { updatePermission } = usePermission();

  const form = useForm<{
    method: string;
    originalUrl: string;
    description: string;
    module: string;
    isPublic: boolean;
  }>({
    resolver: zodResolver(editPermissionSchema),
    defaultValues: {
      method: "",
      originalUrl: "",
      description: "",
      module: "",
      isPublic: false,
    },
  });

  useEffect(() => {
    if (permission) {
      form.reset({
        method: permission.method || "",
        originalUrl: permission.originalUrl || "",
        description: permission.description || "",
        module: permission.module || "",
        isPublic: permission.isPublic || false,
      });
    }
  }, [permission, form]);

  const onSubmit = async (data: {
    method: string;
    originalUrl: string;
    description: string;
    module: string;
    isPublic: boolean;
  }) => {
    if (!permission) return;
    try {
      const payload = {
        ...data,
        _id: permission._id,
      };
      await updatePermission(permission._id, payload);
      onPermissionUpdated();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Lỗi cập nhật permission:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b px-4 py-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-indigo-900">Chỉnh sửa quyền hạn</DialogTitle>
            <DialogDescription className="text-sm text-indigo-600">
              Cập nhật thông tin chi tiết cho quyền hạn
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Phương thức</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full border-2 border-slate-200 focus:border-indigo-400">
                          <SelectValue placeholder="Chọn phương thức" />
                        </SelectTrigger>
                        <SelectContent>
                          {["GET", "POST", "PUT", "DELETE"].map((method) => (
                            <SelectItem key={method} value={method}>
                              <span className={`font-bold ${
                                method === "GET" ? "text-blue-700" :
                                method === "POST" ? "text-green-700" :
                                method === "PUT" ? "text-yellow-700" :
                                "text-red-700"
                              }`}>
                                {method}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="originalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Đường dẫn API</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập đường dẫn (ví dụ: /api/test)"
                        {...field}
                        className="w-full border-2 border-slate-200 focus:border-indigo-400 font-mono"
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
                    <FormLabel className="text-sm font-semibold text-slate-700">Mô tả</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập mô tả"
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
                name="module"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Phân hệ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập tên phân hệ"
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
                name="isPublic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Quyền truy cập</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-3 p-3 border-2 border-slate-200 rounded-lg bg-slate-50">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-2"
                        />
                        <label className="text-sm font-semibold leading-none cursor-pointer">
                          Công khai cho tất cả người dùng
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="border-2"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
