import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import OrganizationView from "@/pages/organization-view";
import VendorView from "@/pages/vendor-view";
import TechnicianDashboard from "@/pages/technician-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isAuthenticated, isLoading, isRoot } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={() => <Login />} />
      </Switch>
    );
  }

  // Root user gets full admin access
  if (user?.role === "root") {
    return (
      <Switch>
        <Route path="/admin/organizations/:id" component={OrganizationView} />
        <Route path="/admin/vendors/:id" component={VendorView} />
        <Route path="/organizations/:id" component={OrganizationView} />
        <Route path="/vendors/:id" component={VendorView} />
        <Route path="/" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Organization roles
  if ((user?.role === "org_admin" || user?.role === "org_subadmin") && user.organizationId) {
    return (
      <Switch>
        <Route path="/" component={() => <OrganizationView />} />
        <Route path="/organization/:id" component={OrganizationView} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Maintenance vendor admin
  if (user?.role === "maintenance_admin" && user.maintenanceVendorId) {
    return (
      <Switch>
        <Route path="/" component={() => <VendorView />} />
        <Route path="/vendor/:id" component={VendorView} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Technician gets basic dashboard only
  if (user?.role === "technician") {
    return (
      <Switch>
        <Route path="/" component={TechnicianDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Default to basic dashboard for authenticated users
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
