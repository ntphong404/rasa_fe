import { z } from "zod";
import { Permission } from "../api/dto/permissions.dto";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{t("Edit Permission")}</DialogTitle>
          <DialogDescription>
            {t("Update details for the permission.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Method")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("Select method")} />
                      </SelectTrigger>
                      <SelectContent>
                        {["GET", "POST", "PUT", "DELETE"].map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
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
                  <FormLabel>{t("Endpoint")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("Enter endpoint (e.g., /api/test)")}
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
              name="originalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("Enter description")}
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
              name="module"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Module")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("Enter module name")}
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
              name="isPublic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Public")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <label className="text-sm font-medium leading-none">
                        {t("Is Public")}
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit">{t("Save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
