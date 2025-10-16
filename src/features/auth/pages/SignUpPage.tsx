"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger } from "@radix-ui/react-popover";
import { CalendarIcon } from "lucide-react";
import "react-day-picker/dist/style.css"; // optional: style mặc định của DayPicker
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRegister } from "@/hooks/useRegister";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

export function SignUpPage({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [date, setDate] = useState<Date>();
  const [gender, setGender] = useState<string>("");
  const { register, isLoading, error: apiError } = useRegister();
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateForm = (formData: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    // phone: string;
    // address: string;
  }) => {
    // Kiểm tra độ mạnh mật khẩu
    const passwordRegex = /^(?=.*[A-Z])(?=.*\W).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setValidationError(
        "Password must be at least 8 characters, include an uppercase letter and a special character"
      );
      return false;
    }

    //Kiểm tra mật khẩu khớp nhau
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return false;
    }

    //Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError("Please enter a valid email address");
      return false;
    }

    //Kiểm tra ngày sinh
    if (!date) {
      setValidationError("Date of birth is required");
      return false;
    }

    // Kiểm tra giới tính
    if (!gender) {
      setValidationError("Please select your gender");
      return false;
    }

    // Kiểm tra số điện thoại
    // const phoneRegex = /^\+?[0-9\s\-$$$$]{8,}$/;
    // if (!phoneRegex.test(formData.phone)) {
    //   setValidationError("Please enter a valid phone number");
    //   return false;
    // }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);

    const formData = new FormData(e.currentTarget);
    const formValues = {
      email: formData.get("email") as string,

      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      // phone: formData.get("phone") as string,
      // address: formData.get("address") as string,
    };
    console.log({ formValues, date, gender });

    // Validate form trước khi gửi
    if (!validateForm(formValues)) {
      return;
    }
    try {
      // Chuẩn bị dữ liệu để gửi đến API
      const registerData = {
        email: formValues.email,
        password: formValues.password,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        // phone: formValues.phone,
        // address: formValues.address,
        dateOfBirth: date ? new Date(date).toISOString() : "",
        gender: gender.toUpperCase(),
      };

      // Gọi API đăng ký thông qua hook
      await register(registerData);
      navigate("/auth/verify");
    } catch (err) {
      // Lỗi đã được xử lý trong hook
      console.error("Form submission error:", err);
    }
  };

  // Hiển thị lỗi từ API hoặc lỗi validation
  const displayError = validationError || apiError;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto mb-6 w-[120px] h-[120px] p-2 items-center">
            <img
              src="/logo.png"
              alt="Logo"
              className="rounded-full object-cover"
            />
          </div>
          {displayError && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {displayError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="grid gap-2">
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  name="firstName"
                  placeholder="John"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Last Name</Label>
                <Input
                  id="username"
                  name="lastName"
                  placeholder="Doe"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              {/* <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  required
                  //   disabled={isLoading}
                />
              </div> */}
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      //   variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1940}
                      toYear={2010}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={gender}
                  onValueChange={setGender}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Enter your full address"
                  className="resize-none"
                  rows={3}
                  //   disabled={isLoading}
                />
              </div> */}

              {/* Password Section */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <a
                href="/auth"
                className="text-primary underline underline-offset-4"
              >
                Login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
