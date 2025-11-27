import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermission } from "@/hooks/usePermission";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// CreatePermissionDialog
const createPermissionSchema = z.object({
  method: z.string().min(1, { message: "Method is required" }),
  originalUrl: z.string().min(1, { message: "Original URL is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  module: z.string().min(1, { message: "Module is required" }),
  isPublic: z.boolean(),
});

interface CreatePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionCreated: () => void;
}

export function CreatePermissionDialog({
  open,
  onOpenChange,
  onPermissionCreated,
}: CreatePermissionDialogProps) {
  const { createPermission } = usePermission();

  const form = useForm<{
    method: string;
    originalUrl: string;
    description: string;
    module: string;
    isPublic: boolean;
  }>({
    resolver: zodResolver(createPermissionSchema),
    defaultValues: {
      method: "",
      originalUrl: "",
      description: "",
      module: "",
      isPublic: false,
    },
  });

  const onSubmit = async (data: {
    method: string;
    originalUrl: string;
    description: string;
    module: string;
    isPublic: boolean;
  }) => {
    try {
      await createPermission(data);
      onPermissionCreated();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Lỗi tạo permission:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b px-4 py-4">
          <DialogTitle className="text-xl font-bold text-indigo-900">Tạo quyền hạn mới</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 mt-1">
            Nhập thông tin chi tiết cho quyền hạn mới
          </DialogDescription>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto px-4 py-4 space-y-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">Phương thức</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full border-2 border-slate-200 focus:border-indigo-400">
                          <SelectValue placeholder="Chọn phương thức" />
                        </SelectTrigger>
                        <SelectContent>
                          {["GET", "POST", "PUT", "DELETE"].map((method) => (
                            <SelectItem key={method} value={method}>
                              <span
                                className={`font-semibold ${
                                  method === "GET"
                                    ? "text-blue-700"
                                    : method === "POST"
                                    ? "text-green-700"
                                    : method === "PUT"
                                    ? "text-yellow-700"
                                    : "text-red-700"
                                }`}
                              >
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
                    <FormLabel className="text-xs font-semibold text-slate-700">Đường dẫn API</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập đường dẫn (ví dụ: /api/test)"
                        {...field}
                        className="w-full font-mono border-2 border-slate-200 focus:border-indigo-400"
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
                    <FormLabel className="text-xs font-semibold text-slate-700">Phân hệ</FormLabel>
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
                    <FormLabel className="text-xs font-semibold text-slate-700">Quyền truy cập</FormLabel>
                    <FormControl>
                      <div className="p-3 border-2 border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <label className="text-sm font-medium leading-none cursor-pointer">
                            Công khai cho tất cả người dùng
                          </label>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="border-t px-4 py-3 flex justify-end gap-2 bg-slate-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-2"
              >
                Hủy
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Tạo quyền hạn
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
