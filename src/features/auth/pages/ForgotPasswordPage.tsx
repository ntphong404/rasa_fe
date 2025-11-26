import { FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useForgotPassword } from "@/hooks/useForgotPassword";

export function ForgotPasswordPage({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const { forgotPassword, loading, error, success } = useForgotPassword();

  // Countdown chống spam gửi OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Kiểm tra định dạng email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email không hợp lệ!");
      return;
    }

    try {
      const res = await forgotPassword({ email })
      toast.success("OTP đã được gửi! Vui lòng kiểm tra email.");
      setCooldown(30)
      navigate("/auth/verify", {
        state: { email, token: res.accessToken, type: "forgot" },
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err?.response?.data?.message;

      if (message?.includes("not found")) {
        toast.error("Email này chưa được đăng ký tài khoản!");
      } else {
        toast.error(message || "Gửi OTP thất bại! Vui lòng thử lại.");
      }
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-auto", className)} {...props}>
      <Card className="w-full max-w-md shadow-lg border rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-lg">Quên mật khẩu</CardTitle>
          <CardDescription>Nhập email để nhận mã OTP đặt lại mật khẩu</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mx-auto mb-0 w-32 h-32 p-0 items-center">
            <AspectRatio ratio={1}>
              <img src="/logo.png" alt="Logo" className="rounded-md object-cover" />
            </AspectRatio>
          </div>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              OTP đã được gửi! Kiểm tra email của bạn.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="kma@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#FC6D26] hover:bg-[#E24329] text-white"
              disabled={loading || cooldown > 0}
            >
              {loading
                ? "Đang gửi..."
                : cooldown > 0
                ? `Gửi lại sau ${cooldown}s`
                : "Gửi mã OTP"}
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}