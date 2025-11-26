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
import { CalendarIcon, ArrowLeft } from "lucide-react";
import "react-day-picker/dist/style.css";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRegister } from "@/hooks/useRegister";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import toast from "react-hot-toast";

export function SignUpPage({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [date, setDate] = useState<Date>();
  const [gender, setGender] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading } = useRegister();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => {
    const checks = [
      (p: string) => p.length >= 8,
      (p: string) => /[0-9]/.test(p),
      (p: string) => /[A-Z]/.test(p),
      (p: string) => /[^A-Za-z0-9]/.test(p),
    ];
    const score = checks.reduce((acc, fn) => acc + (fn(password) ? 1 : 0), 0);
    const label = score <= 1 ? "Yếu" : score === 2 ? "Trung bình" : score === 3 ? "Tốt" : "Rất tốt";
    const color = score <= 1 ? "bg-red-500" : score === 2 ? "bg-yellow-400" : score === 3 ? "bg-emerald-400" : "bg-green-600";
    return { score, label, color };
  }, [password]);

  const validateForm = (formData: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
  }) => {
    if (!formData.firstName.trim()) {
      toast.error("Vui lòng nhập họ!");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Vui lòng nhập tên!");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
      return false;
    }
    if (!date) {
      toast.error("Vui lòng chọn ngày sinh!");
      return false;
    }
    if (!gender) {
      toast.error("Vui lòng chọn giới tính!");
      return false;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\W).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 chữ hoa và 1 ký tự đặc biệt!");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formValues = {
      email: formData.get("email") as string,
      password: password,
      confirmPassword: confirmPassword,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
    };

    if (!validateForm(formValues)) return;

    try {
      const registerData = {
        email: formValues.email,
        password: formValues.password,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        dateOfBirth: date ? new Date(date).toISOString() : "",
        gender: gender.toUpperCase(),
      };
      await register(registerData);
      toast.success("Đăng ký thành công! Vui lòng xác thực email.");
      navigate("/auth/verify", { state: { email: formValues.email, type: "register" } });
    } catch (err: unknown) {
      let message = "Đăng ký thất bại!";
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          message = response.data.message;
        }
      }
      toast.error(message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-start min-h-[70vh]", className)} {...props}>
      <Card className="w-full max-w-5xl shadow-lg border rounded-2xl">
        <CardHeader className="text-center space-y-0 relative pt-1">
          <div className="flex items-center justify-center relative mb-0">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="absolute left-0 p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Quay lại đăng nhập"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <CardTitle className="text-lg">Đăng ký tài khoản</CardTitle>
          </div>
          <CardDescription className="-mt-1">Tạo tài khoản mới để bắt đầu sử dụng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto mb-4 w-32 h-32 p-0 items-center -mt-2">
            <AspectRatio ratio={1}>
              <img src="/logo.png" alt="Logo" className="rounded-md object-cover" />
            </AspectRatio>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label htmlFor="firstName">Họ</Label>
                <Input id="firstName" name="firstName" placeholder="Nguyễn" required disabled={isLoading} className="!text-xs py-1.5 px-2" />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="lastName">Tên</Label>
                <Input id="lastName" name="lastName" placeholder="Văn A" required disabled={isLoading} className="!text-xs py-1.5 px-2" />
              </div>

              <div className="grid gap-1 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="example@email.com" required disabled={isLoading} className="!text-xs py-1.5 px-2" />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="dob">Ngày sinh</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal !text-xs py-1.5 px-2 h-auto", !date && "text-muted-foreground")}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày sinh"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus captionLayout="dropdown-buttons" fromYear={1940} toYear={2010} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="gender">Giới tính</Label>
                <Select value={gender} onValueChange={setGender} disabled={isLoading}>
                  <SelectTrigger className="w-full !text-xs py-1.5 px-2 h-auto">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="!text-xs py-1.5 px-2 pr-10"
                    style={!showPassword ? { WebkitTextSecurity: "circle" } as React.CSSProperties : {}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a5 5 0 100-10 5 5 0 000 10z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="!text-xs py-1.5 px-2 pr-10"
                    style={!showConfirmPassword ? { WebkitTextSecurity: "circle" } as React.CSSProperties : {}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a5 5 0 100-10 5 5 0 000 10z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2 -mt-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex-1 h-2 rounded bg-slate-200 overflow-hidden">
                    <div className={`${passwordStrength.color} h-full transition-all duration-200`} style={{ width: `${(passwordStrength.score / 4) * 100}%` }} />
                  </div>
                  <div className="relative group">
                    <button type="button" className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 115.82 1c0 2-3 2.5-3 4"></path>
                        <line x1="12" y1="17" x2="12" y2="17"></line>
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-2 w-56 p-2 bg-white border rounded shadow-sm text-xs opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10">
                      Ít nhất 8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt.
                    </div>
                  </div>
                  <span className="whitespace-nowrap">Độ mạnh: <span className="font-semibold text-slate-700">{passwordStrength.label}</span></span>
                </div>
                <div className="flex items-center justify-end min-h-[16px]">
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Mật khẩu không khớp</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full bg-[#FC6D26] hover:bg-[#E24329] text-white" disabled={isLoading}>
                {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
              </Button>
              <Button variant="outline" type="button" className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Đăng ký bằng Google
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground -mt-2">
              Đã có tài khoản?{" "}
              <a href="/auth" className="text-[#FC6D26] hover:text-[#E24329] font-medium underline">
                Đăng nhập
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}