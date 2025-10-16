import { useAuthStore } from "@/store/auth";
import { Navigate, Outlet } from "react-router-dom";

export const AuthLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" />;
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 ">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
};
