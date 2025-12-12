/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { FormEvent, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import toast from "react-hot-toast";
import { useMe } from "@/hooks/useMe";
import { useLogin } from "@/hooks/useLogin";
import { ArrowLeft } from "lucide-react";

export function LoginPage({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useLogin();
  const { getMe } = useMe();

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const newFieldErrors: typeof fieldErrors = {};
    const emailTrim = email.trim();
    if (!emailTrim) newFieldErrors.email = "Email là bắt buộc.";
    else if (!isEmail(emailTrim)) newFieldErrors.email = "Vui lòng nhập địa chỉ email hợp lệ.";

    if (!password) newFieldErrors.password = "Mật khẩu là bắt buộc.";
    else if (password.length < 6) newFieldErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";

    if (Object.keys(newFieldErrors).length) {
      setFieldErrors(newFieldErrors);
      if (newFieldErrors.password && newFieldErrors.password.includes("at least")) {
        toast.error(newFieldErrors.password);
      }
      setIsSubmitting(false);
      return;
    }

    try {
      await login({ email, password });
      toast.success("Đăng nhập thành công");
      const me = await getMe();
      useAuthStore.setState({
        isAuthenticated: true,
        user: me,
      });
      navigate("/home_chat");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToChat = () => {
    navigate("/");
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth login
    toast.success("Tính năng đăng nhập Google đang được phát triển");
  };

  return (
    <div className={cn("flex flex-col gap-2 items-center", className)} {...props}>
      <Card className="w-full max-w-sm relative">
        {/* Nút quay lại */}
        <button
          onClick={handleBackToChat}
          className="absolute left-4 top-4 inline-flex items-center justify-center rounded-md p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Quay lại chat"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <CardHeader className="text-center py-1">
          <CardTitle className="text-lg">Đăng nhập</CardTitle>
          <CardDescription>Nhập email hoặc tên đăng nhập để truy cập</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto mb-0 w-32 h-32 p-0 items-center">
            <AspectRatio ratio={1}>
              <img src="/logo2.png" alt="Logo" className="rounded-md object-cover" />
            </AspectRatio>
          </div>

          <div className="mb-1 h-8">
            {error ? (
              <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-1">
                {error}
              </div>
            ) : (
              <div className="h-full invisible" />
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="ví dụ: example@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  onBlur={(e) => {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (!v) setFieldErrors((p) => ({ ...p, email: 'Email là bắt buộc.' }));
                    else if (!isEmail(v)) setFieldErrors((p) => ({ ...p, email: 'Vui lòng nhập địa chỉ email hợp lệ.' }));
                    else setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  aria-invalid={!!fieldErrors.email}
                  required
                  disabled={isSubmitting}
                />
                <p className={`text-xs text-red-600 mt-0.5 h-3 ${fieldErrors.email ? "" : "invisible"}`}>{fieldErrors.email ?? ""}</p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label>Mật khẩu</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    onBlur={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      if (!v) setFieldErrors((p) => ({ ...p, password: 'Mật khẩu là bắt buộc.' }));
                      else if (v.length < 6) setFieldErrors((p) => ({ ...p, password: 'Mật khẩu phải có ít nhất 6 ký tự.' }));
                      else setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    aria-invalid={!!fieldErrors.password}
                    required
                    disabled={isSubmitting}
                    className="pr-10 text-base tracking-wider"
                  />

                  <button
                    type="button"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-accent/50"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className={`text-xs text-red-600 mt-0.5 h-3 ${fieldErrors.password ? "" : "invisible"}`}>{fieldErrors.password ?? ""}</p>
              </div>
              <Button type="submit" className="w-full bg-[#FC6D26] hover:bg-[#E24329] text-white" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Hoặc
                  </span>
                </div>
              </div>

              {/* Google Login Button */}
              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Đăng nhập bằng Google
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                to="/auth/register"
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}