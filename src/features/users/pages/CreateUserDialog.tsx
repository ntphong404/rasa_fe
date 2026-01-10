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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
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
import { rolesService } from "@/features/roles/api/service";
import { 
  UserPlus, 
  Mail, 
  User, 
  Lock, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
  }),
  address: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface Role {
  _id: string;
  name: string;
  description?: string;
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      phoneNumber: "",
      dateOfBirth: "",
      gender: "MALE",
      address: "",
      roleIds: [],
    },
  });

  // Fetch roles when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const response = await rolesService.fetchRoles("");
        if (response?.data) {
          setRoles(response.data);
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [open]);

  const handleSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await userService.createUser(data);
      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create user";
      setError(errorMessage);
      console.error("Error creating user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0 bg-gradient-to-br from-slate-50 via-white to-purple-50 border-2 border-purple-100 shadow-2xl">
        {/* Header with gradient background - Compact */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 px-4 py-4 text-white overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          
          <div className="relative flex items-center gap-2">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              {t("Create New User")}
            </DialogTitle>
          </div>
          
          <DialogDescription className="text-purple-100 text-xs mt-1 relative flex items-center gap-1 ml-8">
            <Sparkles className="h-3 w-3" />
            {t("Add a new user to the system with complete information")}
          </DialogDescription>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-3 flex-shrink-0 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Account Information Section */}
                <div className="bg-white rounded-xl border-2 border-purple-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    Account Information
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700">
                            <Mail className="h-4 w-4 text-purple-600" />
                            {t("Email")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="user@example.com" 
                              {...field}
                              className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700">
                            <Lock className="h-4 w-4 text-purple-600" />
                            {t("Password")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="At least 6 characters" 
                              {...field}
                              className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="bg-white rounded-xl border-2 border-purple-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    Personal Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-gray-700">
                              <User className="h-4 w-4 text-purple-600" />
                              {t("First Name")}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="First name" 
                                {...field}
                                className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-gray-700">
                              <User className="h-4 w-4 text-purple-600" />
                              {t("Last Name")}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Last name" 
                                {...field}
                                className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-gray-700">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              {t("Date of Birth")}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                                className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-gray-700">
                              <User className="h-4 w-4 text-purple-600" />
                              {t("Gender")}
                            </FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200">
                                  <SelectValue placeholder={t("Select gender")} />
                                </SelectTrigger>
                                <SelectContent className="border-2 border-purple-100">
                                  <SelectItem value="MALE">Male</SelectItem>
                                  <SelectItem value="FEMALE">Female</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-xl border-2 border-purple-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    Contact Information
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700">
                            <Phone className="h-4 w-4 text-purple-600" />
                            {t("Phone Number")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Phone number" 
                              {...field}
                              className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700">
                            <MapPin className="h-4 w-4 text-purple-600" />
                            {t("Address")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Address" 
                              {...field}
                              className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Role Assignment Section */}
                <div className="bg-white rounded-xl border-2 border-purple-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    Role Assignment
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="roleIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700">
                          <Shield className="h-4 w-4 text-purple-600" />
                          {t("Role")}
                        </FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value?.[0] || ""} 
                            onValueChange={(value) => field.onChange(value ? [value] : [])}
                            disabled={loadingRoles}
                          >
                            <SelectTrigger className="h-11 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200">
                              <SelectValue placeholder={
                                loadingRoles ? (
                                  <span className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("Loading roles...")}
                                  </span>
                                ) : (
                                  t("Select a role")
                                )
                              } />
                            </SelectTrigger>
                            <SelectContent className="border-2 border-purple-100">
                              {roles.map((role) => (
                                <SelectItem key={role._id} value={role._id} className="cursor-pointer hover:bg-purple-50">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-purple-600" />
                                    {role.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t-2 border-purple-100 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="border-2 hover:bg-gray-100 transition-all duration-200"
              >
                {t("Cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Creating...")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t("Create User")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
