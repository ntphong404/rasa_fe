import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import axiosInstance from "@/api/axios";

export function ResetPasswordPage({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const id = location.state?.id;
  const otp = location.state?.otp;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (!id || !otp) {
      toast.error("Thiếu thông tin xác thực. Vui lòng thực hiện lại quy trình quên mật khẩu!");
      navigate("/auth/forgot-password");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post(
        "/api/auth/reset-password",
        { id, otp, password }
      );

      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      navigate("/auth");
    } catch (err: unknown) {
      let message = "Đặt lại mật khẩu thất bại!";
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          message = response.data.message;
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div
      className={cn(
        "flex flex-col gap-6 items-center justify-start min-h-[70vh]",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-sm shadow-lg border rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold">
            Đặt lại mật khẩu
          </CardTitle>
          <CardDescription>Nhập mật khẩu mới của bạn</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mx-auto mb-4 w-20 h-20">
            <AspectRatio ratio={1}>
              <img
                src="/logo.png"
                alt="Logo"
                className="rounded-md object-contain"
              />
            </AspectRatio>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={!showPassword ? { WebkitTextSecurity: "circle" } as React.CSSProperties : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {!showPassword ? (
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

              <div className="mt-2">
                <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
                  <div
                    className={`${passwordStrength.color} h-full transition-all duration-200`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500 w-full">
                  <div className="text-xs">Độ mạnh: <span className="font-semibold text-slate-700">{passwordStrength.label}</span></div>

                  <div className="relative group">
                    <button
                      type="button"
                      aria-label="Yêu cầu mật khẩu"
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 115.82 1c0 2-3 2.5-3 4"></path>
                        <line x1="12" y1="17" x2="12" y2="17"></line>
                      </svg>
                    </button>

                    <div className="absolute right-0 mt-2 w-64 p-2 bg-white border border-slate-200 rounded shadow-sm text-xs text-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 group-hover:pointer-events-auto transition-opacity">
                      Ít nhất 6 ký tự, 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={!showConfirmPassword ? { WebkitTextSecurity: "circle" } as React.CSSProperties : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {!showConfirmPassword ? (
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

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full bg-[#FC6D26] hover:bg-[#E24329] text-white" disabled={loading}>
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </Button>

              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={() => navigate("/auth")}
                disabled={loading}
              >
                Quay lại đăng nhập
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}