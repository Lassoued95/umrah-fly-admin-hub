import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "@/lib/api";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
