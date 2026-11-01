import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { RoleProvider } from "@/contexts/RoleContext";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import TalentPool from "./pages/TalentPool";
import TalentPoolWorkspace from "./pages/TalentPoolWorkspace";
import Organization from "./pages/Organization";
import Apply from "./pages/Apply";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import TrialRegistration from "./pages/TrialRegistration";
import Notifications from "./pages/Notifications";
import CalendarPage from "./pages/InterviewCalendar";
import EmailsPage from "./pages/EmailsPage";
import AutomationsPage from "./pages/AutomationsPage";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";

const queryClient = new QueryClient();

// Automatic clean reset to purge all leaked legacy demo data & accounts
if (typeof window !== 'undefined' && localStorage.getItem('hireforce_clean_profile_v10') !== 'true') {
  try {
    localStorage.removeItem('hireforce_unified_account');
    localStorage.removeItem('hireforce_calendar_settings');
    localStorage.removeItem('hireforce_video_meeting_connected');
    localStorage.removeItem('hireforce_local_jobs');
    localStorage.removeItem('hireforce_local_candidates');
    localStorage.removeItem('hireforce_local_interviews');
    localStorage.removeItem('hireforce_email_accounts');
    localStorage.removeItem('hireforce_local_emails');

    // Clear any trial user keys that accidentally captured demo connections
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key) {
        if (key.startsWith('hireforce_unified_account') || key.startsWith('hireforce_video_meeting_connected') || key.startsWith('hireforce_local_')) {
          const val = localStorage.getItem(key);
          if (val && (val.includes('angellagarland') || val.includes('recruiter_lead') || key === 'hireforce_unified_account')) {
            localStorage.removeItem(key);
          }
        }
      }
    }
    localStorage.setItem('hireforce_clean_profile_v10', 'true');
  } catch {}
}

// Protected Route component
const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/trial" element={<TrialRegistration />} />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/jobs" element={
        <ProtectedRoute>
          <Jobs />
        </ProtectedRoute>
      } />
      <Route path="/jobs/:jobId" element={
        <ProtectedRoute>
          <JobDetails />
        </ProtectedRoute>
      } />
      <Route path="/talent-pool" element={
        <ProtectedRoute>
          <TalentPool />
        </ProtectedRoute>
      } />
      <Route path="/talent-pool/:jobId" element={
        <ProtectedRoute>
          <TalentPool />
        </ProtectedRoute>
      } />
      <Route path="/candidates" element={
        <ProtectedRoute>
          <TalentPool />
        </ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute>
          <CalendarPage />
        </ProtectedRoute>
      } />
      <Route path="/emails" element={
        <ProtectedRoute>
          <EmailsPage />
        </ProtectedRoute>
      } />
      <Route path="/automations" element={
        <ProtectedRoute>
          <AutomationsPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Organization />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />
      <Route path="/apply" element={<Apply />} />
      <Route path="/apply/:jobId" element={<Apply />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/security" element={<Security />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TenantProvider>
          <RoleProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppRoutes />
            </BrowserRouter>
          </RoleProvider>
        </TenantProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
