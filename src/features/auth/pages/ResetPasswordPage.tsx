import { FormEvent, useState } from "react";
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
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Đặt lại mật khẩu thất bại!";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 items-center justify-center min-h-screen",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-md shadow-lg border rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold">
            Đặt lại mật khẩu
          </CardTitle>
          <CardDescription>Nhập mật khẩu mới của bạn</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mx-auto mb-6 w-[120px] h-[120px]">
            <AspectRatio ratio={1}>
              <img
                src="/logo.png"
                alt="Logo"
                className="rounded-md object-contain"
              />
            </AspectRatio>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}