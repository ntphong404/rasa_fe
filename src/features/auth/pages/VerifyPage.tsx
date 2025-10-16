import { ThemeProvider } from "@/components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useVerify } from "@/hooks/useVerify";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function VerifyPage() {
  const { verify, isLoading, error } = useVerify();
  const navigate = useNavigate();
  const location = useLocation();
  const { email, token, type } = location.state || {};
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "error" | "success"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      setVerificationStatus("error");
      setErrorMessage("Verification code cannot be empty");
      setPopupMessage("Verification code cannot be empty");
      setIsPopupOpen(true);
      return;
    }

    setIsVerifying(true);
    try {
      // Truyền cả otp và token vào verify nếu cần
      const result = await verify(otp, token);
      console.log("verify result", result);
      if (!result || result.success === false) {
        // handle lỗi theo body trả về
        const msg = result?.message || "Verification failed";
        throw new Error(msg);
      }
      setVerificationStatus("success");
      setPopupMessage("Verification successful! Redirecting...");
      setIsPopupOpen(true);
      await sleep(1200);
      if (type === "register") {
        navigate("/auth");
      } else if (type === "forgot") {
        navigate("/auth/reset-password", { state: { email, token } });
      } else {
        navigate("/auth");
      }
    } catch (error) {
      console.log(error);
      setVerificationStatus("error");
      setPopupMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setIsPopupOpen(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-32 w-32 mx-auto mb-10"
              />
              <h1 className="text-2xl font-bold tracking-tight">
                Verify your account
              </h1>
              <p className="text-muted-foreground">
                Enter the verification code sent to your email{" "}
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="verification-code"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Verification code
                </label>
                <Input
                  id="verification-code"
                  placeholder="Enter verification code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-10"
                  disabled={isVerifying || verificationStatus === "success"}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#FC6D26] hover:bg-[#E24329] text-white"
                // disabled={isVerifying || verificationStatus === "success"}
                disabled={isLoading}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Didn't receive a code?{" "}
                <a
                  href="#"
                  className="text-[#FC6D26] hover:text-[#E24329] font-medium underline"
                >
                  Resend code
                </a>
              </p>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Return to{" "}
                <a
                  href="#"
                  className="text-[#FC6D26] hover:text-[#E24329] font-medium underline"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </main>

        <footer className="py-6 border-t border-border">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">© 2025 KMA </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground">
                  Terms
                </a>
                <a href="#" className="hover:text-foreground">
                  Privacy
                </a>
                <a href="#" className="hover:text-foreground">
                  Help
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogContent>
          <DialogTitle>
            {verificationStatus === "success" ? "Success" : "Error"}
          </DialogTitle>
          <p>{popupMessage}</p>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
