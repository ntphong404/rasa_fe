import { useAuthStore } from "@/store/auth";
import { Navigate, Outlet } from "react-router-dom";

export const AuthLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isPreAccess = useAuthStore((state) => state.isPreAccess);
  
  // Allow access to auth pages if user is pre-authenticated (needs email verification)
  // Only redirect if user is fully authenticated
  if (isAuthenticated && !isPreAccess) return <Navigate to="/" />;
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-5 ">
      <div className="w-full max-w-lg">
        <Outlet />
      </div>
    </div>
  );
};
