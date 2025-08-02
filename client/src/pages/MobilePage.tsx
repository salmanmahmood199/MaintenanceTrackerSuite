import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Smartphone, Calendar, Settings, Bell, LogOut, CheckCircle, Ticket as TicketIcon, 
  AlertCircle, TrendingUp, Plus, Clock, User as UserIcon, MapPin, Filter, Search,
  MessageSquare, Image, Video, FileText, Phone, Mail, Users, Building2,
  Wrench, Edit, Eye, ArrowLeft, ChevronDown, MoreVertical, Home,
  DollarSign, Star, Camera, List, X, UserCheck, XCircle, CheckSquare, Building, Trash2
} from 'lucide-react';
import { CreateTicketModal } from "@/components/create-ticket-modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TicketActionModal } from "@/components/ticket-action-modal";
import { ConfirmCompletionModal } from "@/components/confirm-completion-modal";
import { MarketplaceBidsModal } from "@/components/marketplace-bids-modal";
import { EnhancedInvoiceCreator } from "@/components/enhanced-invoice-creator";
import { TicketComments } from "@/components/ticket-comments";
import { ProgressTrackerEmbedded } from "@/components/progress-tracker";
import { WorkOrdersHistory } from "@/components/work-orders-history";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTicketSchema } from "@shared/schema";
import type { 
  Ticket,
  InsertTicket,
  Organization, 
  MaintenanceVendor, 
  User,
  Location 
} from "@shared/schema";
import taskscoutLogo from '@assets/Logo_1753808482955.png';

// Mobile Create Ticket Form Component
const MobileCreateTicketForm = ({ onClose, onSuccess, user }: { onClose: () => void, onSuccess: () => void, user: any }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const { toast } = useToast();

  // Fetch user's assigned locations
  const { data: userLocations = [] } = useQuery<Location[]>({
    queryKey: ["/api/users", user?.id, "locations"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/locations`);
      return await response.json() as Location[];
    },
    enabled: !!user?.id,
  });
  
  const form = useForm<InsertTicket>({
    resolver: zodResolver(insertTicketSchema.omit({ reporterId: true, organizationId: true })),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium" as const,
    },
  });

  const handleSubmit = async (data: any) => {
    // Validate location selection for users with location assignments
    if (userLocations.length > 0 && !data.locationId) {
      form.setError("locationId", { 
        type: "manual", 
        message: "Please select a location for this ticket" 
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image or video.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('priority', data.priority);
      if (data.locationId) {
        formData.append('locationId', data.locationId.toString());
      }
      
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/tickets', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ticket created successfully!",
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to create ticket",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Create Ticket</h2>
          <p className="text-sm text-blue-100">New maintenance request</p>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-24">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the maintenance issue..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Priority Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Location <span className="text-red-500">*</span>
                  </FormLabel>
                  {userLocations.length > 0 ? (
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location for this ticket" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.name}
                            {location.address && ` - ${location.address}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-md">
                      <p className="text-sm text-yellow-200">
                        No locations assigned to your account. Please contact your administrator to assign locations before creating tickets.
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-sm font-medium text-foreground">Upload Images & Videos *</Label>
              <div className="mt-2">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center relative">
                  <div className="flex flex-col items-center justify-center">
                    <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {images.length > 0 ? `${images.length} file(s) selected` : 'Tap to add photos or videos'}
                    </p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setImages(prev => [...prev, ...files]);
                        }}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" size="sm" className="mt-2" asChild>
                        <span>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Files
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {images.slice(0, 6).map((file, index) => (
                      <div key={index} className="relative aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            {file.type.startsWith('video/') ? <Video className="h-6 w-6 mx-auto" /> : <Image className="h-6 w-6 mx-auto" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate px-1">
                            {file.name.length > 12 ? `${file.name.substring(0, 12)}...` : file.name}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            </form>
          </Form>
        </div>
      </div>

      {/* Fixed Footer Buttons */}
      <div className="flex-shrink-0 p-4 border-t border-white/20 bg-gradient-to-r from-slate-900/90 to-purple-900/90 backdrop-blur-sm">
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting || images.length === 0}
            className="bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 border-0"
          >
            {isSubmitting ? (
              "Creating..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const MobilePage = () => {
  const [email, setEmail] = useState('root@mail.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<MaintenanceVendor | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketActionOpen, setIsTicketActionOpen] = useState(false);
  const [isConfirmCompletionOpen, setIsConfirmCompletionOpen] = useState(false);
  const [isMarketplaceBidsOpen, setIsMarketplaceBidsOpen] = useState(false);
  const [isTicketDetailsOpen, setIsTicketDetailsOpen] = useState(false);
  const [isWorkOrderOpen, setIsWorkOrderOpen] = useState(false);
  const [isInvoiceCreatorOpen, setIsInvoiceCreatorOpen] = useState(false);
  const [ticketAction, setTicketAction] = useState<"accept" | "reject" | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'organization' | 'vendor' | 'calendar' | 'marketplace'>('dashboard');
  const [ticketDateFilter, setTicketDateFilter] = useState<'all' | 'last30' | 'last7' | 'today'>('last30');
  const [selectedTicketForDetails, setSelectedTicketForDetails] = useState<Ticket | null>(null);
  const [isTicketDetailModalOpen, setIsTicketDetailModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [parts, setParts] = useState([{ name: "", quantity: 1, cost: 0 }]);
  const [otherCharges, setOtherCharges] = useState([{ description: "", cost: 0 }]);
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [isWorkOrderHistoryOpen, setIsWorkOrderHistoryOpen] = useState(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<string | null>(null);

  // Calculate hours between time in and time out
  const calculateHours = (timeIn: string, timeOut: string) => {
    if (!timeIn || !timeOut) return 0;
    
    try {
      const [inHour, inMin] = timeIn.split(':').map(Number);
      const [outHour, outMin] = timeOut.split(':').map(Number);
      
      if (isNaN(inHour) || isNaN(inMin) || isNaN(outHour) || isNaN(outMin)) return 0;
      
      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;
      
      if (outMinutes <= inMinutes) return 0;
      
      const totalMinutes = outMinutes - inMinutes;
      return Math.round((totalMinutes / 60) * 100) / 100;
    } catch (error) {
      return 0;
    }
  };

  // Fetch available parts for this vendor
  const { data: availableParts = [] } = useQuery({
    queryKey: [`/api/maintenance-vendors/${user?.maintenanceVendorId}/parts`],
    enabled: !!user?.maintenanceVendorId,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries for data
  const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
    enabled: !!user,
  });

  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: !!user && (user.role === "root" || user.role === "org_admin"),
  });

  // Fetch technicians for maintenance admin users
  const { data: technicians = [] } = useQuery<Array<{id: number, firstName: string, lastName: string, email: string}>>({
    queryKey: ["/api/maintenance-vendors", user?.maintenanceVendorId, "technicians"],
    queryFn: async () => {
      if (!user?.maintenanceVendorId) return [];
      const response = await apiRequest("GET", `/api/maintenance-vendors/${user.maintenanceVendorId}/technicians`);
      return await response.json();
    },
    enabled: !!user?.maintenanceVendorId && user.role === "maintenance_admin",
  });

  // Fetch vendor tiers (similar to web app approach)
  const { data: vendorTiers = [], isLoading: vendorsLoading } = useQuery<Array<{vendor: MaintenanceVendor, tier: string, isActive: boolean}>>({
    queryKey: user?.role === "maintenance_admin" 
      ? ["/api/maintenance-vendors"] 
      : user?.organizationId 
        ? ["/api/organizations", user.organizationId, "vendor-tiers"]
        : ["/api/maintenance-vendors"],
    queryFn: async () => {
      if (user?.role === "maintenance_admin") {
        // Maintenance admin - get all vendors and convert to tier format
        const response = await apiRequest("GET", "/api/maintenance-vendors");
        const allVendors = await response.json() as MaintenanceVendor[];
        return allVendors.map(vendor => ({
          vendor,
          tier: 'all',
          isActive: true
        }));
      } else if (user?.organizationId && (user?.role === "org_admin" || user?.role === "org_subadmin")) {
        // Organization users - get vendor tiers directly
        const response = await apiRequest("GET", `/api/organizations/${user.organizationId}/vendor-tiers`);
        const orgVendorTiers = await response.json() as Array<{vendor: MaintenanceVendor, tier: string, isActive: boolean}>;
        

        
        return orgVendorTiers;
      } else if (user?.role === "root") {
        // Root user - get all vendors and convert to tier format
        const response = await apiRequest("GET", "/api/maintenance-vendors");
        const allVendors = await response.json() as MaintenanceVendor[];
        return allVendors.map(vendor => ({
          vendor,
          tier: 'all',
          isActive: true
        }));
      }
      return [];
    },
    enabled: !!user && (user.role === "root" || user.role === "org_admin" || user.role === "org_subadmin" || user.role === "maintenance_admin"),
  });

  // Removed redundant vendorTiers query - now handled directly in vendors query above

  // Marketplace queries
  const { data: marketplaceTickets = [], isLoading: marketplaceLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/marketplace/tickets"],
    enabled: !!user && (user.role === 'maintenance_admin' || user.role === 'technician'),
  });

  const { data: myBids = [], isLoading: bidsLoading } = useQuery<any[]>({
    queryKey: ["/api/marketplace/my-bids"],
    enabled: !!user && (user.role === 'maintenance_admin'),
  });

  // Check authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        {/* Animated Background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 text-center p-4">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <img 
              src={taskscoutLogo} 
              alt="TaskScout Logo" 
              className="w-16 h-16 object-contain"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">TaskScout</h1>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading TaskScout Mobile...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Get user data and update state instead of reloading
        const userResponse = await fetch('/api/auth/user', { credentials: 'include' });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          queryClient.invalidateQueries();
        }
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData.message);
        toast({
          title: "Login Failed",
          description: errorData.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    queryClient.clear();
  };

  // Login screen for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        {/* Animated Background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 w-full max-w-md space-y-8 p-4">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <img 
                src={taskscoutLogo} 
                alt="TaskScout Logo" 
                className="w-20 h-20 object-contain"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">TaskScout</h1>
            </div>
            <p className="text-gray-400">Mobile App - Sign in to your account</p>
          </div>

          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-white">Mobile Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="root@mail.com"
                    className="text-base bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin"
                    className="text-base bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 text-xs p-2 h-8 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      setEmail('root@mail.com');
                      setPassword('admin');
                    }}
                  >
                    Root
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 text-xs p-2 h-8 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      setEmail('admin@vendor.vendor');
                      setPassword('password');
                    }}
                  >
                    Vendor
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 text-xs p-2 h-8 bg-white/5 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      setEmail('admin@nsrpetroservices.org');
                      setPassword('password');
                    }}
                  >
                    Org Admin
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full text-base py-6 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 text-white"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-white mb-2">Quick Access:</h3>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div><strong className="text-white">Root Admin:</strong> root@mail.com / admin</div>
                    <div><strong className="text-white">Org Admin:</strong> admin@nsrpetroservices.org / password</div>
                    <div><strong className="text-white">Vendor Admin:</strong> admin@vendor.vendor / password</div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'accepted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in-progress': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending_confirmation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'ready_for_billing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'billed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleTicketAction = (ticket: Ticket, action: "accept" | "reject") => {
    setSelectedTicket(ticket);
    setTicketAction(action);
    setIsTicketActionOpen(true);
  };

  const handleViewTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDetailsOpen(true);
  };

  const handleCreateWorkOrder = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsWorkOrderOpen(true);
  };

  const handleViewBids = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsMarketplaceBidsOpen(true);
  };

  const handleCreateInvoice = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsInvoiceCreatorOpen(true);
  };

  const handleConfirmCompletion = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsConfirmCompletionOpen(true);
  };

  // Filter tickets based on date range
  const getFilteredTickets = () => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (ticketDateFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        return tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case 'last7':
        filterDate.setDate(now.getDate() - 7);
        return tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case 'last30':
        filterDate.setDate(now.getDate() - 30);
        return tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case 'all':
      default:
        return tickets;
    }
  };

  const filteredTickets = getFilteredTickets();

  const getDashboardView = () => {
    if (user.role === 'root') {
      return (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Organizations</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{organizations.length}</p>
                  </div>
                  <div className="bg-blue-500/10 p-2.5 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Vendors</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{vendorTiers.length}</p>
                  </div>
                  <div className="bg-green-500/10 p-2.5 rounded-lg">
                    <Wrench className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organizations List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setSelectedOrganization(org);
                        setCurrentView('organization');
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.email}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Vendors List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {vendorTiers.map((vendorTier) => (
                    <div
                      key={vendorTier.vendor.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setSelectedVendor(vendorTier.vendor);
                        setCurrentView('vendor');
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{vendorTier.vendor.name}</p>
                        <p className="text-sm text-muted-foreground">{vendorTier.vendor.email}</p>
                        <p className="text-xs text-muted-foreground">Tier: {vendorTier.tier}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Default ticket dashboard for other roles
    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Tickets</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{tickets.length}</p>
                </div>
                <div className="bg-blue-500/10 p-2.5 rounded-lg">
                  <TicketIcon className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Open</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {tickets.filter((t: any) => t.status === 'open').length}
                  </p>
                </div>
                <div className="bg-yellow-500/10 p-2.5 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="h-5 w-5" />
              Recent Tickets
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => setIsCreateTicketOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </CardHeader>
          <CardContent>
            {/* Date Filter */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTickets.length} of {tickets.length} tickets
                </p>
                <div className="flex items-center gap-2">
                  <Select value={ticketDateFilter} onValueChange={(value: "all" | "last30" | "last7" | "today") => setTicketDateFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last7">Last 7 days</SelectItem>
                      <SelectItem value="last30">Last 30 days</SelectItem>
                      <SelectItem value="all">All tickets</SelectItem>
                    </SelectContent>
                  </Select>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredTickets.slice(0, 20).map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">
                          {ticket.title || 'Untitled Ticket'}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {ticket.ticketNumber || `#${ticket.id}`}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedTicketForDetails(ticket);
                            setIsTicketDetailModalOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedTicketForDetails(ticket);
                            setIsTicketDetailModalOpen(true);
                          }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Comments
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedTicketForDetails(ticket);
                            setIsTicketDetailModalOpen(true);
                          }}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedTicketForDetails(ticket);
                            setIsTicketDetailModalOpen(true);
                          }}>
                            <Wrench className="h-4 w-4 mr-2" />
                            Work Orders
                          </DropdownMenuItem>
                          {/* Accept/Reject for users with proper permissions */}
                          {(
                            (user.role === 'org_admin') || 
                            (user.role === 'org_subadmin' && user.permissions?.includes('accept_ticket'))
                          ) && (ticket.status === 'open' || ticket.status === 'pending') && (
                            <>
                              <DropdownMenuItem onClick={() => handleTicketAction(ticket, 'accept')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Ticket
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTicketAction(ticket, 'reject')}>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Reject Ticket
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {/* Vendor-specific actions for maintenance admins */}
                          {user.role === 'maintenance_admin' && (
                            <>
                              {/* Accept assignment when ticket is assigned to vendor */}
                              {ticket.maintenanceVendorId === user.maintenanceVendorId && ticket.status === 'accepted' && !ticket.assigneeId && (
                                <DropdownMenuItem onClick={() => handleTicketAction(ticket, 'accept')}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Accept & Assign Technician
                                </DropdownMenuItem>
                              )}
                              {/* Reject assignment when ticket is assigned to vendor */}
                              {ticket.maintenanceVendorId === user.maintenanceVendorId && ticket.status === 'accepted' && (
                                <DropdownMenuItem onClick={() => handleTicketAction(ticket, 'reject')}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject Assignment
                                </DropdownMenuItem>
                              )}
                              {/* Accept/Reject open tickets that can be assigned to any vendor */}
                              {(ticket.status === 'open' || ticket.status === 'pending') && !ticket.maintenanceVendorId && (
                                <>
                                  <DropdownMenuItem onClick={() => handleTicketAction(ticket, 'accept')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accept Ticket
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTicketAction(ticket, 'reject')}>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Reject Ticket
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          )}
                          {/* Technician actions */}
                          {user.role === 'technician' && ticket.assigneeId === user.id && (
                            <>
                              {ticket.status === 'accepted' && (
                                <DropdownMenuItem onClick={() => handleCreateWorkOrder(ticket)}>
                                  <Wrench className="h-4 w-4 mr-2" />
                                  Start Work
                                </DropdownMenuItem>
                              )}
                              {ticket.status === 'in-progress' && (
                                <DropdownMenuItem onClick={() => handleCreateWorkOrder(ticket)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete Work
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {/* Marketplace actions */}
                          {ticket.assignedToMarketplace && (
                            <DropdownMenuItem onClick={() => handleViewBids(ticket)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              View Marketplace Bids
                            </DropdownMenuItem>
                          )}
                          
                          {/* Marketplace bidding for vendors */}
                          {user.role === 'maintenance_admin' && ticket.assignedToMarketplace && !ticket.maintenanceVendorId && (
                            <DropdownMenuItem onClick={() => handleViewBids(ticket)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Place Bid
                            </DropdownMenuItem>
                          )}
                          
                          {/* Billing actions */}
                          {user.role === 'maintenance_admin' && ticket.status === 'ready_for_billing' && ticket.maintenanceVendorId === user.maintenanceVendorId && (
                            <DropdownMenuItem onClick={() => handleCreateInvoice(ticket)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Create Invoice
                            </DropdownMenuItem>
                          )}
                          
                          {/* Completion confirmation for requesters */}
                          {(ticket.reporterId === user.id || user.role === 'org_admin' || (user.role === 'org_subadmin' && user.permissions?.includes('accept_ticket'))) && ticket.status === 'completed' && (
                            <DropdownMenuItem onClick={() => handleConfirmCompletion(ticket)}>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Confirm Completion
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(ticket.status)} variant="secondary">
                        {ticket.status?.replace('_', ' ').replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>


                    </div>
                    
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      {ticket.images && ticket.images.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          <span>{ticket.images.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getOrganizationView = () => {
    if (!selectedOrganization) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedOrganization.name}</h2>
            <p className="text-sm text-muted-foreground">Organization Dashboard</p>
          </div>
        </div>

        {/* Organization stats and content would go here */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Tickets</p>
                  <p className="text-2xl font-bold">
                    {tickets.filter(t => t.organizationId === selectedOrganization.id).length}
                  </p>
                </div>
                <TicketIcon className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const getVendorView = () => {
    if (!selectedVendor) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedVendor.name}</h2>
            <p className="text-sm text-muted-foreground">Vendor Dashboard</p>
          </div>
        </div>

        {/* Vendor stats and content would go here */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Tickets</p>
                  <p className="text-2xl font-bold">
                    {tickets.filter(t => t.maintenanceVendorId === selectedVendor.id).length}
                  </p>
                </div>
                <TicketIcon className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Technicians</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const getCalendarView = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const generateCalendarDays = () => {
      const days = [];
      
      // Empty cells for days before the first day of month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
        days.push(
          <div
            key={day}
            className={`h-10 w-10 flex items-center justify-center rounded-lg text-sm cursor-pointer hover:bg-muted ${
              isToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:text-foreground'
            }`}
          >
            {day}
          </div>
        );
      }
      
      return days;
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {monthNames[currentMonth]} {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays()}
              </div>
              
              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Schedule maintenance feature will be available soon.",
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "Calendar Integration",
                        description: "View your scheduled maintenance appointments here.",
                      });
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View Scheduled
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getMarketplaceView = () => {
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Marketplace</h2>
            <p className="text-sm text-muted-foreground">Available tickets for bidding</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">
                    {marketplaceTickets.length}
                  </p>
                </div>
                <TicketIcon className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">My Bids</p>
                  <p className="text-2xl font-bold">
                    {myBids.length || 0}
                  </p>
                </div>
                <Star className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Marketplace Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open Marketplace Tickets</CardTitle>
            <CardDescription>
              Tickets available for bidding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {marketplaceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading marketplace tickets...</p>
                  </div>
                ) : marketplaceTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tickets available for bidding</p>
                  </div>
                ) : (
                  marketplaceTickets.map((ticket: Ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleViewTicketDetails(ticket)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-card-foreground truncate flex-1">
                          {ticket.title}
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle place bid
                            toast({
                              title: "Place Bid",
                              description: "Bidding functionality coming soon",
                            });
                          }}
                        >
                          Bid
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(ticket.status)} variant="secondary">
                          {ticket.status?.replace('_', ' ').replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        {ticket.images && ticket.images.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            <span>{ticket.images.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getCurrentView = () => {
    switch (currentView) {
      case 'organization':
        return getOrganizationView();
      case 'vendor':
        return getVendorView();
      case 'calendar':
        return getCalendarView();
      case 'marketplace':
        return getMarketplaceView();
      default:
        return getDashboardView();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">TaskScout</h1>
              <p className="text-xs text-blue-100">Mobile</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="p-2 text-white hover:bg-white/10">
              <Bell className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-xs text-white hover:bg-white/10"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* User Profile Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 pb-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white/20 bg-white/10">
            <AvatarFallback className="bg-white/10 text-white font-bold backdrop-blur-sm">
              {(user.first_name || user.firstName)?.[0] || user.email[0].toUpperCase()}{(user.last_name || user.lastName)?.[0] || ''}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-white">
              {user.first_name || user.firstName} {user.last_name || user.lastName || ''}
            </h2>
            <p className="text-blue-100 text-sm capitalize">{user.role?.replace('_', ' ')}</p>
            <div className="flex items-center space-x-2 mt-1">
              <CheckCircle className="h-3 w-3 text-green-400" />
              <span className="text-xs text-blue-100">Online</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 border-white/20">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-background border-b border-border px-4 -mt-2">
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
          <TabsList className="w-full flex bg-muted overflow-x-auto">
            <TabsTrigger value="dashboard" className="text-xs flex-shrink-0">
              <Home className="h-4 w-4 mr-1" />
              Home
            </TabsTrigger>
            {user.role === 'root' && (
              <>
                <TabsTrigger value="organization" className="text-xs flex-shrink-0">
                  <Building2 className="h-4 w-4 mr-1" />
                  Orgs
                </TabsTrigger>
                <TabsTrigger value="vendor" className="text-xs flex-shrink-0">
                  <Wrench className="h-4 w-4 mr-1" />
                  Vendors
                </TabsTrigger>
              </>
            )}
            {(user.role === 'maintenance_admin' || user.role === 'technician') && (
              <TabsTrigger value="marketplace" className="text-xs flex-shrink-0">
                <DollarSign className="h-4 w-4 mr-1" />
                Market
              </TabsTrigger>
            )}
            <TabsTrigger value="calendar" className="text-xs flex-shrink-0">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {getCurrentView()}
      </div>

      {/* Mobile Ticket Details Modal */}
      <Dialog open={isTicketDetailModalOpen} onOpenChange={setIsTicketDetailModalOpen}>
        <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTicketDetailModalOpen(false)}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedTicketForDetails?.title || 'Ticket Details'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedTicketForDetails?.ticketNumber || `#${selectedTicketForDetails?.id}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="flex-1 overflow-y-auto p-4">
                {selectedTicketForDetails && (
                  <div className="space-y-4">
                    {/* Status & Priority */}
                    <div className="flex gap-2">
                      <Badge variant="secondary" className={getStatusColor(selectedTicketForDetails.status)}>
                        {selectedTicketForDetails.status?.replace('_', ' ').replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(selectedTicketForDetails.priority)}>
                        {selectedTicketForDetails.priority}
                      </Badge>
                    </div>

                    {/* Description */}
                    {selectedTicketForDetails.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedTicketForDetails.description}
                        </p>
                      </div>
                    )}

                    {/* Images */}
                    {selectedTicketForDetails.images && selectedTicketForDetails.images.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Images ({selectedTicketForDetails.images.length})</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedTicketForDetails.images.map((image: string, idx: number) => (
                            <div key={idx} className="aspect-square bg-muted rounded-lg overflow-hidden border">
                              {image.includes('.mp4') || image.includes('.mov') || image.includes('.MOV') ? (
                                <video 
                                  src={image}
                                  className="w-full h-full object-cover"
                                  controls
                                  playsInline
                                  onError={(e) => {
                                    console.error('Video load error:', image);
                                    const target = e.target as HTMLVideoElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">Video unavailable<br/>${image}</div>`;
                                  }}
                                />
                              ) : (
                                <img 
                                  src={image} 
                                  alt={`Ticket image ${idx + 1}`}
                                  className="w-full h-full object-cover cursor-pointer"
                                  loading="lazy"
                                  onClick={() => setSelectedImageForViewer(image)}
                                  onError={(e) => {
                                    console.error('Image load error:', image);
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">Image unavailable<br/>${image}</div>`;
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Created Date */}
                    <div>
                      <h3 className="font-semibold mb-2">Created</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedTicketForDetails.createdAt && 
                          new Date(selectedTicketForDetails.createdAt).toLocaleString()
                        }
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="flex-1 overflow-y-auto p-4">
                {selectedTicketForDetails && (
                  <TicketComments 
                    ticket={selectedTicketForDetails} 
                    userRole={user?.role}
                    userId={user?.id}
                  />
                )}
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="flex-1 overflow-y-auto p-4">
                {selectedTicketForDetails && (
                  <ProgressTrackerEmbedded 
                    ticket={selectedTicketForDetails} 
                    canUpdate={user?.role === 'org_admin' || user?.role === 'maintenance_admin'}
                  />
                )}
              </TabsContent>

              {/* Work Orders Tab */}
              <TabsContent value="work-orders" className="flex-1 overflow-y-auto p-4">
                {selectedTicketForDetails && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setIsWorkOrderHistoryOpen(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      View All Work Orders
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Click above to view detailed work order history with parts, labor, and completion notes.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Orders History Modal */}
      <WorkOrdersHistory
        open={isWorkOrderHistoryOpen}
        onOpenChange={setIsWorkOrderHistoryOpen}
        ticketId={selectedTicketForDetails?.id || null}
      />

      {/* Modals */}
      <CreateTicketModal
        open={isCreateTicketOpen}
        onOpenChange={setIsCreateTicketOpen}
        onSubmit={(data, images) => {
          // Handle ticket creation here
          console.log('Creating ticket:', data, images);
          setIsCreateTicketOpen(false);
          refetchTickets();
        }}
        isLoading={false}
        userId={user?.id}
        organizationId={user?.organizationId}
      />

      {selectedTicket && (
        <>
          <TicketActionModal
            open={isTicketActionOpen}
            onOpenChange={(open) => {
              setIsTicketActionOpen(open);
              if (!open) {
                setSelectedTicket(null);
                setTicketAction(null);
              }
            }}
            ticket={selectedTicket}
            action={ticketAction}
            vendors={vendorTiers}
            technicians={technicians}
            userRole={user?.role}
            userPermissions={user?.permissions}
            userVendorTiers={user?.vendorTiers}
            onAccept={async (ticketId, data) => {
              try {
                const response = await fetch(`/api/tickets/${ticketId}/accept`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(data),
                });
                
                if (response.ok) {
                  toast({
                    title: "Success",
                    description: "Ticket accepted successfully",
                  });
                  setIsTicketActionOpen(false);
                  setSelectedTicket(null);
                  setTicketAction(null);
                  refetchTickets();
                } else {
                  const error = await response.json();
                  toast({
                    title: "Error",
                    description: error.message || "Failed to accept ticket",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to accept ticket",
                  variant: "destructive",
                });
              }
            }}
            onReject={async (ticketId, reason) => {
              try {
                const response = await fetch(`/api/tickets/${ticketId}/reject`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ rejectionReason: reason }),
                });
                
                if (response.ok) {
                  toast({
                    title: "Success", 
                    description: "Ticket rejected successfully",
                  });
                  setIsTicketActionOpen(false);
                  setSelectedTicket(null);
                  setTicketAction(null);
                  refetchTickets();
                } else {
                  const error = await response.json();
                  toast({
                    title: "Error",
                    description: error.message || "Failed to reject ticket",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to reject ticket",
                  variant: "destructive",
                });
              }
            }}
            isLoading={false}
          />

          <ConfirmCompletionModal
            open={isConfirmCompletionOpen}
            onOpenChange={(open) => {
              setIsConfirmCompletionOpen(open);
              if (!open) {
                setSelectedTicket(null);
              }
            }}
            ticket={selectedTicket}
            onConfirm={(confirmed, feedback) => {
              console.log('Confirm completion:', confirmed, feedback);
              setIsConfirmCompletionOpen(false);
              setSelectedTicket(null);
              refetchTickets();
            }}
            isLoading={false}
          />

          <MarketplaceBidsModal
            isOpen={isMarketplaceBidsOpen}
            onClose={() => {
              setIsMarketplaceBidsOpen(false);
              setSelectedTicket(null);
            }}
            ticket={selectedTicket}
          />

          {/* Enhanced Ticket Details Modal - Mobile Optimized */}
          <Dialog open={isTicketDetailsOpen} onOpenChange={setIsTicketDetailsOpen}>
            <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
              <div className="h-full flex flex-col">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle className="flex items-center gap-2">
                    <TicketIcon className="h-5 w-5" />
                    Ticket Details
                  </DialogTitle>
                </DialogHeader>
                
                {selectedTicket && (
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                      {/* Ticket Header */}
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{selectedTicket.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{selectedTicket.ticketNumber}</p>
                        <div className="flex gap-2 mb-3">
                          <Badge className={getStatusColor(selectedTicket.status)}>
                            {selectedTicket.status?.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                      </div>

                      {/* Original Images */}
                      {selectedTicket.images && selectedTicket.images.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Attachments ({selectedTicket.images.length})</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedTicket.images.map((image, index) => (
                              <div key={index} className="aspect-square bg-background rounded border overflow-hidden">
                                <img
                                  src={image}
                                  alt={`Attachment ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Work Orders Section */}
                      <div>
                        <h4 className="font-medium mb-3">Work Orders</h4>
                        <WorkOrdersHistory ticketId={selectedTicket.id} />
                      </div>

                      {/* Comments Section */}
                      <div>
                        <h4 className="font-medium mb-3">Comments & Updates</h4>
                        <TicketComments 
                          ticketId={selectedTicket.id}
                          userRole={user?.role}
                          userId={user?.id}
                        />
                      </div>

                      {/* Progress Tracker */}
                      <div>
                        <h4 className="font-medium mb-3">Progress</h4>
                        <ProgressTrackerEmbedded ticket={selectedTicket} />
                      </div>
                    </div>
                  </ScrollArea>
                )}

                {/* Fixed Footer with Actions */}
                <div className="p-4 border-t bg-background">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsTicketDetailsOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Enhanced Work Order Modal - Mobile Optimized with Proper Scrolling */}
          <Dialog open={isWorkOrderOpen} onOpenChange={setIsWorkOrderOpen}>
            <DialogContent className="max-w-full h-screen w-screen m-0 p-0 rounded-none max-h-screen">
              <div className="h-screen flex flex-col">
                {/* Fixed Header */}
                <div className="bg-background border-b p-4 flex-shrink-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Create Work Order</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsWorkOrderOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Scrollable Content */}
                {selectedTicket && (
                  <div 
                    className="flex-1 overflow-y-auto bg-muted"
                    style={{ 
                      height: 'calc(100vh - 140px)', 
                      overflowY: 'auto',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <div className="p-4 space-y-6">
                      {/* Original Ticket Information */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-foreground mb-2">Original Request</h4>
                        <p className="text-sm text-muted-foreground mb-3">{selectedTicket.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span>#{selectedTicket.ticketNumber}</span>
                          <span>{selectedTicket.createdAt && new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Original Images - Clickable to Enlarge */}
                        {selectedTicket.images && selectedTicket.images.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Original Photos ({selectedTicket.images.length})</p>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedTicket.images.slice(0, 6).map((image, index) => (
                                <div 
                                  key={index} 
                                  className="aspect-square bg-background rounded border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedImageIndex(index)}
                                >
                                  <img
                                    src={image}
                                    alt={`Original ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Work Description */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <Label className="text-sm font-medium text-foreground">Work Description *</Label>
                        <Textarea
                          placeholder="Describe the work performed in detail..."
                          className="mt-2 min-h-[100px] resize-none"
                        />
                      </div>

                      {/* Time Tracking */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-foreground mb-3">Time Tracking</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Work Date</Label>
                            <Input
                              type="date"
                              value={new Date().toISOString().split('T')[0]}
                              disabled
                              className="mt-1 bg-muted"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Time In *</Label>
                              <Input 
                                type="time" 
                                value={timeIn}
                                onChange={(e) => setTimeIn(e.target.value)}
                                className="mt-1" 
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Time Out *</Label>
                              <Input 
                                type="time" 
                                value={timeOut}
                                onChange={(e) => setTimeOut(e.target.value)}
                                className="mt-1" 
                              />
                            </div>
                          </div>
                          
                          {/* Calculated Hours Display */}
                          {timeIn && timeOut && calculateHours(timeIn, timeOut) > 0 && (
                            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mt-3">
                              <div className="font-medium text-green-900 dark:text-green-100">
                                Total Hours: {calculateHours(timeIn, timeOut)} hours
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Parts Used */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-foreground">Parts Used</h4>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setParts(prev => [...prev, { name: "", quantity: 1, cost: 0 }])}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Part
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {parts.map((part, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-background">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-muted-foreground">Part Name</Label>
                                  {parts.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setParts(prev => prev.filter((_, i) => i !== index))}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <Select
                                  value={part.name && part.name !== "custom" ? part.name : ""}
                                  onValueChange={(value) => {
                                    if (value === "custom") {
                                      setParts(prev => prev.map((p, i) => i === index ? { ...p, name: "custom", cost: 0 } : p));
                                    } else {
                                      const selectedPart = availableParts.find((p: any) => p.name === value);
                                      if (selectedPart) {
                                        setParts(prev => prev.map((p, i) => i === index ? { 
                                          ...p, 
                                          name: value, 
                                          cost: selectedPart.sellingPrice || 0 
                                        } : p));
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a part" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.isArray(availableParts) && availableParts.map((availablePart: any) => (
                                      <SelectItem key={availablePart.id} value={availablePart.name}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{availablePart.name}</span>
                                          {availablePart.description && (
                                            <span className="text-xs text-muted-foreground">{availablePart.description}</span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="custom">
                                      <span className="italic text-muted-foreground">Custom part...</span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {part.name === "custom" && (
                                  <div className="mt-2">
                                    <Label className="text-xs text-muted-foreground">Custom Part Name</Label>
                                    <Input
                                      placeholder="Enter custom part name"
                                      onChange={(e) => setParts(prev => prev.map((p, i) => i === index ? { ...p, name: e.target.value } : p))}
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                                    <Input 
                                      type="number" 
                                      min="1" 
                                      value={part.quantity}
                                      onChange={(e) => setParts(prev => prev.map((p, i) => i === index ? { ...p, quantity: parseInt(e.target.value) || 1 } : p))}
                                      className="mt-1" 
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                      {part.name === "custom" ? "Selling Price ($)" : "Selling Price (Auto-filled)"}
                                    </Label>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      value={part.cost}
                                      disabled={part.name !== "custom"}
                                      onChange={(e) => setParts(prev => prev.map((p, i) => i === index ? { ...p, cost: parseFloat(e.target.value) || 0 } : p))}
                                      placeholder="0.00" 
                                      className={part.name !== "custom" ? "mt-1 bg-muted text-muted-foreground" : "mt-1"} 
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {parts.length > 0 && (
                          <div className="text-sm text-foreground font-medium mt-2">
                            Parts Total: ${parts.reduce((total, part) => total + (part.cost * part.quantity), 0).toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Note: Other Charges section removed for technicians as per web version */}

                      {/* Completion Status */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <Label className="text-sm font-medium text-foreground">Completion Status *</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select completion status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="return_needed">Return Visit Needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Completion Notes */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <Label className="text-sm font-medium text-foreground">Completion Notes *</Label>
                        <Textarea
                          placeholder="Provide detailed notes about the work completion..."
                          className="mt-2 min-h-[80px] resize-none"
                        />
                      </div>

                      {/* Work Completion Photos */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <Label className="text-sm font-medium text-foreground">Work Completion Photos</Label>
                        <div className="mt-3 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                          <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-3">
                            Add photos of completed work
                          </p>
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4 mr-2" />
                            Take Photos
                          </Button>
                        </div>
                      </div>

                      {/* Manager Verification */}
                      <div className="bg-card p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-foreground mb-3">Manager Verification</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Manager Name *</Label>
                            <Input 
                              placeholder="Enter manager's full name" 
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Manager Signature *</Label>
                            <div className="mt-2 border rounded-lg p-4 bg-background">
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-2">
                                  Manager signature area (digital signature required)
                                </p>
                                <Button variant="outline" size="sm">
                                  Sign Here
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Extra padding at bottom for safe scrolling */}
                      <div className="h-4"></div>
                    </div>
                  </div>
                )}

                {/* Fixed Footer */}
                <div className="bg-background border-t p-4 flex-shrink-0">
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsWorkOrderOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        setIsWorkOrderOpen(false);
                        refetchTickets();
                        toast({
                          title: "Work Order Created",
                          description: "Work order submitted successfully"
                        });
                      }}
                    >
                      Submit Work Order
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Image Enlargement Modal with better exit functionality */}
          {selectedImageIndex !== null && selectedTicket?.images && (
            <Dialog open={true} onOpenChange={() => setSelectedImageIndex(null)}>
              <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
                <div 
                  className="relative h-full bg-black flex items-center justify-center"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 bg-black/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(null);
                    }}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-4 left-4 z-10 text-white hover:bg-white/20 bg-black/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(null);
                    }}
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </Button>
                  <img
                    src={selectedTicket.images[selectedImageIndex]}
                    alt={`Original ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded">
                    {selectedImageIndex + 1} of {selectedTicket.images.length}
                  </div>
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-80">
                    Tap anywhere to close
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <EnhancedInvoiceCreator
            open={isInvoiceCreatorOpen}
            onOpenChange={(open) => {
              setIsInvoiceCreatorOpen(open);
              if (!open) {
                setSelectedTicket(null);
              }
            }}
            ticket={selectedTicket}
            onSubmit={(data) => {
              console.log('Submit invoice:', data);
              setIsInvoiceCreatorOpen(false);
              setSelectedTicket(null);
              refetchTickets();
            }}
            isLoading={false}
            workOrders={[]}
            vendor={null}
            organization={null}
            location={null}
          />
        </>
      )}

      {/* Create Ticket Modal - Mobile Optimized */}
      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
          <MobileCreateTicketForm 
            onClose={() => setIsCreateTicketOpen(false)}
            onSuccess={() => {
              setIsCreateTicketOpen(false);
              refetchTickets();
            }}
            user={user}
          />
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImageForViewer} onOpenChange={() => setSelectedImageForViewer(null)}>
        <DialogContent className="max-w-full h-full m-0 p-0 bg-black/95 border-0 rounded-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full"
              onClick={() => setSelectedImageForViewer(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            {selectedImageForViewer && (
              <img
                src={selectedImageForViewer}
                alt="Full size view"
                className="max-w-full max-h-full object-contain"
                onClick={() => setSelectedImageForViewer(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobilePage;