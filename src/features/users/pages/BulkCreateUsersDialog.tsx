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
import { 
  Trash2, 
  Plus, 
  Users, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  UserPlus
} from "lucide-react";

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
      <DialogContent className="w-[98vw] max-w-[1800px] h-[85vh] flex flex-col gap-0 p-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 border-2 border-emerald-100 shadow-2xl">
        {/* Header with gradient background - Compact */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-4 text-white overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          
          <div className="relative flex items-center gap-2">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              {t("Create Users in Bulk")}
            </DialogTitle>
          </div>
          
          <DialogDescription className="text-emerald-100 text-xs mt-1 relative flex items-center gap-1 ml-8">
            <Sparkles className="h-3 w-3" />
            {t("Fill in user details below. Click 'Add User' to add more rows, then click 'Create Users' to save all at once.")}
          </DialogDescription>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-3 flex-shrink-0 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-start gap-3 flex-shrink-0 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Success</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Header Row - Fixed */}
              <div className="grid grid-cols-8 gap-2 pb-3 border-b-2 border-emerald-200 font-semibold text-sm text-gray-700 flex-shrink-0 pr-4 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 rounded-t-xl">
                <div className="flex items-center gap-1">
                  <span>📧</span> {t("Email")}
                </div>
                <div className="flex items-center gap-1">
                  <span>👤</span> {t("First Name")}
                </div>
                <div className="flex items-center gap-1">
                  <span>👤</span> {t("Last Name")}
                </div>
                <div className="flex items-center gap-1">
                  <span>📱</span> {t("Phone")}
                </div>
                <div className="flex items-center gap-1">
                  <span>📅</span> {t("DOB")}
                </div>
                <div className="flex items-center gap-1">
                  <span>⚧</span> {t("Gender")}
                </div>
                <div className="flex items-center gap-1">
                  <span>📍</span> {t("Address")}
                </div>
                <div className="flex items-center gap-1">
                  <span>⚙️</span> {t("Action")}
                </div>
              </div>

              {/* Data Rows - Scrollable */}
              <div className="flex-1 overflow-y-auto border-2 border-emerald-100 rounded-b-xl mt-2 bg-white shadow-inner">
                <div className="p-4 space-y-3">
                  {fields.map((field, index) => (
                    <div 
                      key={field.id} 
                      className="grid grid-cols-8 gap-2 pr-2 p-3 bg-gradient-to-r from-white to-emerald-50/30 rounded-lg border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                    >
                      <FormField
                        control={form.control}
                        name={`users.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="user@example.com"
                                {...field}
                                className="h-9 text-xs border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
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
                                className="h-9 text-xs border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
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
                                className="h-9 text-xs border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
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
                                className="h-9 text-xs border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
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
                                className="h-9 text-xs border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
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
                                <SelectTrigger className="h-9 text-xs border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200">
                                  <SelectValue placeholder="Gender" />
                                </SelectTrigger>
                                <SelectContent className="border-2 border-emerald-100">
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
                                className="h-9 text-xs border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
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
                            className="h-9 px-2 hover:bg-red-50 border-2 border-transparent hover:border-red-200 transition-all duration-200"
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
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-emerald-50 border-t-2 border-emerald-200 flex-shrink-0 flex gap-3 items-center">
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
            className="bg-white border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("Add User")}
          </Button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-emerald-200 rounded-lg shadow-sm">
            <UserPlus className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">
              {fields.length} {t("user(s)")}
            </span>
          </div>
          
          <div className="flex-1" />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            size="sm"
            disabled={isLoading}
            className="border-2 hover:bg-gray-100 transition-all duration-200"
          >
            {t("Cancel")}
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
            onClick={() => form.handleSubmit(handleSubmit)()}
            size="sm"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Creating...")}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("Create Users")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
