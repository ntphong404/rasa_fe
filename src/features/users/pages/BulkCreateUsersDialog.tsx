import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { userService } from "../api/service";
import { Trash2, Plus } from "lucide-react";

const bulkCreateUsersSchema = z.object({
  users: z
    .array(
      z.object({
        email: z.string().email("Invalid email address"),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        phoneNumber: z.string().optional(),
        dateOfBirth: z.string().min(1, "Date of birth is required"),
        gender: z.enum(["MALE", "FEMALE", "OTHER"], {
          errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
        }),
        address: z.string().optional(),
      })
    )
    .min(1, "At least one user is required"),
});

type BulkCreateUsersFormData = z.infer<typeof bulkCreateUsersSchema>;

interface BulkCreateUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkCreateUsersDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkCreateUsersDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<BulkCreateUsersFormData>({
    resolver: zodResolver(bulkCreateUsersSchema),
    defaultValues: {
      users: [
        {
          email: "",
          firstName: "",
          lastName: "",
          phoneNumber: "",
          dateOfBirth: "",
          gender: "MALE",
          address: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "users",
  });

  const handleSubmit = async (data: BulkCreateUsersFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await userService.createBulkUsers({ users: data.users });

      setSuccessMessage(
        `${t("Successfully created")} ${data.users.length} ${t("users")}`
      );
      form.reset({
        users: [
          {
            email: "",
            firstName: "",
            lastName: "",
            phoneNumber: "",
            dateOfBirth: "",
            gender: "MALE",
            address: "",
          },
        ],
      });
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create users";
      setError(errorMessage);
      console.error("Error creating users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        users: [
          {
            email: "",
            firstName: "",
            lastName: "",
            phoneNumber: "",
            dateOfBirth: "",
            gender: "MALE",
            address: "",
          },
        ],
      });
      setError(null);
      setSuccessMessage(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[98vw] max-w-[1800px] h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>{t("Create Users in Bulk")}</DialogTitle>
          <DialogDescription>
            {t(
              "Fill in user details below. Click 'Add User' to add more rows, then click 'Create Users' to save all at once."
            )}
          </DialogDescription>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded text-sm flex-shrink-0">
              {successMessage}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Header Row - Fixed */}
              <div className="grid grid-cols-8 gap-2 pb-2 border-b font-semibold text-xs text-muted-foreground flex-shrink-0 pr-4">
                <div>{t("Email")}</div>
                <div>{t("First Name")}</div>
                <div>{t("Last Name")}</div>
                <div>{t("Phone")}</div>
                <div>{t("DOB")}</div>
                <div>{t("Gender")}</div>
                <div>{t("Address")}</div>
                <div>{t("Action")}</div>
              </div>

              {/* Data Rows - Scrollable */}
              <div className="flex-1 overflow-y-auto border rounded-lg mt-2 bg-white">
                <div className="p-4 space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-8 gap-2 pr-2">
                      <FormField
                        control={form.control}
                        name={`users.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="user@example.com"
                                {...field}
                                className="h-8 text-xs"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`users.${index}.firstName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="First"
                                {...field}
                                className="h-8 text-xs"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`users.${index}.lastName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Last"
                                {...field}
                                className="h-8 text-xs"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`users.${index}.phoneNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Phone"
                                {...field}
                                className="h-8 text-xs"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`users.${index}.dateOfBirth`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="h-8 text-xs"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`users.${index}.gender`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MALE">Male</SelectItem>
                                  <SelectItem value="FEMALE">Female</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`users.${index}.address`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Address"
                                {...field}
                                className="h-8 text-xs"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-start pt-1 justify-center">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8 px-2 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 flex gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                email: "",
                firstName: "",
                lastName: "",
                phoneNumber: "",
                dateOfBirth: "",
                gender: "MALE",
                address: "",
              })
            }
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("Add User")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {fields.length} {t("user(s)")}
          </span>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            size="sm"
          >
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={() => form.handleSubmit(handleSubmit)()}
            size="sm"
          >
            {isLoading ? t("Creating...") : t("Create Users")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

