import { useAuthStore } from "@/store/auth";
import { Navigate, Outlet } from "react-router-dom";

export const AuthLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" />;
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-5 ">
      <div className="w-full max-w-lg">
        <Outlet />
      </div>
    </div>
  );
};
