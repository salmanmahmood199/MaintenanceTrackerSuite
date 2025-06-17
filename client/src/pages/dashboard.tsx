import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface Organization {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface MaintenanceVendor {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  specialties: string[] | null;
  isActive: boolean;
  createdAt: Date;
}

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch organizations
  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Fetch maintenance vendors
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<MaintenanceVendor[]>({
    queryKey: ["/api/maintenance-vendors"],
  });

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Root Administration</h1>
                <p className="text-slate-600">Manage organizations and maintenance vendors</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-slate-500">{user.email}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
              <p className="text-xs text-muted-foreground">
                Active client organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered service providers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <Link href="/admin">
              <Button className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Manage System</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Organizations Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Organizations</h2>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Manage All
              </Button>
            </Link>
          </div>
          
          {orgsLoading ? (
            <div className="text-center py-8 text-slate-500">Loading organizations...</div>
          ) : organizations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No organizations found</p>
                <Link href="/admin">
                  <Button>Create First Organization</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.slice(0, 6).map((org) => (
                <Card key={org.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={`/admin/organizations/${org.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-slate-900 truncate">{org.name}</h3>
                        <Badge variant={org.isActive ? "default" : "secondary"}>
                          {org.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {org.description && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {org.description}
                        </p>
                      )}
                      <div className="text-xs text-slate-500">
                        {org.email || "No email"}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Vendors Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Maintenance Vendors</h2>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Manage All
              </Button>
            </Link>
          </div>
          
          {vendorsLoading ? (
            <div className="text-center py-8 text-slate-500">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No vendors found</p>
                <Link href="/admin">
                  <Button>Add First Vendor</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.slice(0, 6).map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={`/admin/vendors/${vendor.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-slate-900 truncate">{vendor.name}</h3>
                        <Badge variant={vendor.isActive ? "default" : "secondary"}>
                          {vendor.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {vendor.description && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {vendor.description}
                        </p>
                      )}
                      {vendor.specialties && vendor.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {vendor.specialties.slice(0, 2).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {vendor.specialties.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{vendor.specialties.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        {vendor.email || "No email"}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}