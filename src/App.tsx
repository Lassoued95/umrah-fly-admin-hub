import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Plannings from "./pages/Plannings";
import Duas from "./pages/Duas";
import Rituals from "./pages/Rituals";
import Dhikr from "./pages/Dhikr";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RootRoute = () => <Navigate to="/dashboard" replace />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/plannings" element={<Plannings />} />
              <Route path="/duas" element={<Duas />} />
              <Route path="/rituals" element={<Rituals />} />
              <Route path="/dhikr" element={<Dhikr />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
