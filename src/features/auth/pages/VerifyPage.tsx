import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useVerify } from "@/hooks/useVerify";
import { authService } from "@/features/auth/api/service";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function VerifyPage({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { verify, isLoading } = useVerify();
  const navigate = useNavigate();
  const location = useLocation();
  const { email, type } = location.state || {};

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes = 300 seconds

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format countdown as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Vui lòng nhập mã xác thực!");
      return;
    }

    try {
      setLoading(true);

      let result;
      if (type === "forgot") {
        // Gọi verify-reset-otp cho luồng forgot password
        result = await authService.verifyResetOtp(otp);
      } else {
        // Gọi verify-email cho luồng register
        result = await verify(otp);
      }

      if (!result || result.success === false) {
        const msg = result?.message || "Xác thực thất bại!";
        throw new Error(msg);
      }

      toast.success("Xác thực thành công! Đang chuyển hướng...");
      await sleep(1200);

      if (type === "register") {
        navigate("/auth");
      } else if (type === "forgot") {
        navigate("/auth/reset-password", { state: { otp } });
      } else {
        navigate("/auth");
      }
    } catch (err: unknown) {
      let message = "Xác thực thất bại!";
      if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    // TODO: Implement resend logic
    setCountdown(300); // Reset to 5 minutes
    toast.success("Đã gửi lại mã xác thực!");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 items-center justify-start min-h-[70vh] py-8",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-md shadow-lg border rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-lg">
            Xác thực tài khoản
          </CardTitle>
          <CardDescription>
            Nhập mã xác thực đã gửi tới email của bạn
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mx-auto mb-0 w-32 h-32 p-0 items-center">
            <AspectRatio ratio={1}>
              <img src="/logo2.png" alt="Logo" className="rounded-md object-cover" />
            </AspectRatio>
          </div>

          {email && (
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Mã xác thực đã được gửi đến: <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-sm font-semibold mt-2">
                {countdown > 0 ? (
                  <span className="text-[#FC6D26]">Mã hết hạn sau: {formatTime(countdown)}</span>
                ) : (
                  <span className="text-red-500">Mã đã hết hạn! Vui lòng gửi lại.</span>
                )}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">Mã xác thực</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Nhập mã xác thực"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={loading || isLoading}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Vui lòng kiểm tra hộp thư đến hoặc thư rác của bạn
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full bg-[#FC6D26] hover:bg-[#E24329] text-white"
                disabled={loading || isLoading}
              >
                {loading || isLoading ? "Đang xác thực..." : "Xác thực"}
              </Button>

              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={handleResendCode}
                disabled={loading || isLoading || countdown > 0}
              >
                {countdown > 0 ? `Gửi lại sau ${formatTime(countdown)}` : "Gửi lại mã xác thực"}
              </Button>

              <Button
                variant="ghost"
                type="button"
                className="w-full"
                onClick={() => navigate("/auth")}
                disabled={loading || isLoading}
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