import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Notifications from "./pages/Notifications";
import ActivityLogs from "./pages/ActivityLogs";
import Documents from "./pages/Documents";
import EmployeeProfile from "./pages/EmployeeProfile";
import Settings from "./pages/Settings";
import Training from "./pages/Training";
import Recruitment from "./pages/Recruitment";
import Announcements from "./pages/Announcements";
import UserManagement from "./pages/UserManagement";
import SalaryStructures from "./pages/Payroll/SalaryStructures";
import EmployeeSalaries from "./pages/Payroll/EmployeeSalaries";
import PayrollProcessing from "./pages/Payroll/PayrollProcessing";
import Expenses from "./pages/EmployeeDashboard/Expenses";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/employees" element={<Employees />} />
                        <Route path="/employees/:id" element={<EmployeeProfile />} />
                        <Route path="/departments" element={<Departments />} />
                        <Route path="/attendance" element={<Attendance />} />
                        <Route path="/leave" element={<Leave />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/activity-logs" element={<ActivityLogs />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/training" element={<Training />} />
                        <Route path="/salary-structures" element={<SalaryStructures />} />
                        <Route path="/employee-salaries" element={<EmployeeSalaries />} />
                        <Route path="/payroll" element={<PayrollProcessing />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/recruitment" element={<Recruitment />} />
                        <Route path="/announcements" element={<Announcements />} />
                        <Route path="/user-management" element={<UserManagement />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
