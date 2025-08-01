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
  DollarSign, Star, Camera, List, X
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
  const [isWorkOrderHistoryOpen, setIsWorkOrderHistoryOpen] = useState(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<string | null>(null);
  
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

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<MaintenanceVendor[]>({
    queryKey: ["/api/maintenance-vendors"],
    enabled: !!user && (user.role === "root" || user.role === "maintenance_admin"),
  });

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
                      setEmail('placeticket@nsrpetro.com');
                      setPassword('password');
                    }}
                  >
                    Sub-Admin
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
                    <div><strong className="text-white">Sub Admin:</strong> placeticket@nsrpetro.com / password</div>
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
                    <p className="text-2xl font-bold text-foreground mt-1">{vendors.length}</p>
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
                  {vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setCurrentView('vendor');
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
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
                          {user.role === 'org_admin' && ticket.status === 'open' && (
                            <>
                              <DropdownMenuItem onClick={() => handleTicketAction(ticket, 'accept')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTicketAction(ticket, 'reject')}>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.role === 'technician' && ticket.status === 'accepted' && (
                            <DropdownMenuItem onClick={() => handleCreateWorkOrder(ticket)}>
                              <Wrench className="h-4 w-4 mr-2" />
                              Start Work
                            </DropdownMenuItem>
                          )}
                          {ticket.assignedToMarketplace && (
                            <DropdownMenuItem onClick={() => handleViewBids(ticket)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              View Bids
                            </DropdownMenuItem>
                          )}
                          {user.role === 'maintenance_admin' && ticket.status === 'ready_for_billing' && (
                            <DropdownMenuItem onClick={() => handleCreateInvoice(ticket)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Create Invoice
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
            vendors={[]}
            onAccept={(ticketId, data) => {
              console.log('Accept ticket:', ticketId, data);
              setIsTicketActionOpen(false);
              setSelectedTicket(null);
              setTicketAction(null);
              refetchTickets();
            }}
            onReject={(ticketId, reason) => {
              console.log('Reject ticket:', ticketId, reason);
              setIsTicketActionOpen(false);
              setSelectedTicket(null);
              setTicketAction(null);
              refetchTickets();
            }}
            isLoading={false}
            userRole={user?.role}
            userPermissions={user?.permissions}
            userVendorTiers={user?.vendorTiers}
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

          {/* Ticket Details Modal - Using Dialog for basic details view */}
          <Dialog open={isTicketDetailsOpen} onOpenChange={setIsTicketDetailsOpen}>
            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle>Ticket Details</DialogTitle>
              </DialogHeader>
              {selectedTicket && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{selectedTicket.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm">{selectedTicket.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  {selectedTicket.images && selectedTicket.images.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Attachments</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTicket.images.slice(0, 4).map((image, index) => (
                          <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Work Order Modal - Using Dialog for basic work order creation */}
          <Dialog open={isWorkOrderOpen} onOpenChange={setIsWorkOrderOpen}>
            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle>Create Work Order</DialogTitle>
              </DialogHeader>
              {selectedTicket && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Ticket: {selectedTicket.title}</p>
                    <p className="text-xs text-muted-foreground">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Work Description</label>
                      <Textarea
                        placeholder="Describe the work performed..."
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Hours Worked</label>
                        <Input type="number" placeholder="0" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="return_needed">Return Needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setIsWorkOrderOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        setIsWorkOrderOpen(false);
                        refetchTickets();
                      }}>
                        Create Work Order
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

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