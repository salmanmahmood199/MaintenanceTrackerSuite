import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Smartphone, User, Settings, Plus, List, CheckCircle, 
  Home, Ticket, Calendar, Building, Wrench, Bell,
  Search, Filter, Camera, MapPin, Clock, AlertCircle,
  Star, TrendingUp, Users, DollarSign, Eye, Edit,
  MessageSquare, Image, Video, FileText, Phone, Mail
} from 'lucide-react';

const MobilePage = () => {
  const [email, setEmail] = useState('root@mail.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);

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
          await loadData(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const loadData = async (userData: any) => {
    try {
      // Load tickets
      const ticketsRes = await fetch('/api/tickets', { credentials: 'include' });
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData);
      }

      // Load organizations (for root admin)
      if (userData.role === 'root') {
        const orgsRes = await fetch('/api/organizations', { credentials: 'include' });
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          setOrganizations(orgsData);
        }

        const vendorsRes = await fetch('/api/maintenance-vendors', { credentials: 'include' });
        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json();
          setVendors(vendorsData);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TaskScout Mobile...</p>
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
        // Reload page after successful login to re-check auth
        window.location.reload();
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Smartphone className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">TaskScout Mobile</CardTitle>
            <CardDescription>
              Sign in to manage your maintenance tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="text-base"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full text-base py-6"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              <div className="text-center text-sm text-gray-500">
                Demo: root@mail.com / admin
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending_confirmation': return 'bg-purple-100 text-purple-800';
      case 'ready_for_billing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">TaskScout</h1>
              <p className="text-xs text-gray-500">Mobile</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="p-2">
              <Bell className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                setUser(null);
              }}
              className="text-xs"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* User Profile Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white">
            <AvatarFallback className="bg-white text-blue-600 font-bold">
              {user.firstName?.[0]}{user.lastName?.[0] || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">
              {user.firstName} {user.lastName || ''}
            </h2>
            <p className="text-blue-100 text-sm capitalize">{user.role.replace('_', ' ')}</p>
            <div className="flex items-center space-x-2 mt-1">
              <CheckCircle className="h-3 w-3 text-green-400" />
              <span className="text-xs text-blue-100">Online</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="text-white border-white/20">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 -mt-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Tickets</p>
                  <p className="text-xl font-bold text-gray-900">{tickets.length}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Ticket className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Open</p>
                  <p className="text-xl font-bold text-gray-900">
                    {tickets.filter((t: any) => t.status === 'open').length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-1">
              <Home className="h-4 w-4" />
              <span className="text-xs">Home</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center space-x-1">
              <Ticket className="h-4 w-4" />
              <span className="text-xs">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="more" className="flex items-center space-x-1">
              <List className="h-4 w-4" />
              <span className="text-xs">More</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="h-16 flex flex-col space-y-1 bg-gradient-to-r from-green-500 to-green-600"
                    onClick={() => setShowCreateTicket(true)}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Create Ticket</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col space-y-1"
                    onClick={() => setActiveTab('tickets')}
                  >
                    <Search className="h-5 w-5" />
                    <span className="text-xs">Search</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col space-y-1"
                    onClick={() => setActiveTab('calendar')}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Schedule</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col space-y-1"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-xs">Quick Photo</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tickets */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Recent Tickets</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('tickets')}>
                    <span className="text-xs">View All</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {tickets.slice(0, 3).map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Wrench className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {ticket.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`text-xs px-2 py-0 ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {tickets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Ticket className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No tickets yet</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowCreateTicket(true)}
                    >
                      Create First Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {/* Search Bar */}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search tickets..." 
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Tickets List */}
            <ScrollArea className="h-[60vh]">
              <div className="space-y-3">
                {tickets.map((ticket: any) => (
                  <Card key={ticket.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">
                            {ticket.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>
                        <div className="ml-2 flex flex-col items-end space-y-1">
                          <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority} priority
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3" />
                          <span>#{ticket.id}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          {ticket.images && ticket.images.length > 0 && (
                            <div className="flex items-center text-xs text-gray-400">
                              <Image className="h-3 w-3 mr-1" />
                              <span>{ticket.images.length}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Eye className="h-3 w-3 mr-1" />
                            <span className="text-xs">View</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            <span className="text-xs">Comment</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {tickets.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="font-medium text-gray-900 mb-2">No tickets found</h3>
                      <p className="text-sm text-gray-500 mb-4">Get started by creating your first maintenance ticket</p>
                      <Button onClick={() => setShowCreateTicket(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="font-medium text-gray-900 mb-2">Calendar View</h3>
                <p className="text-sm text-gray-500 mb-4">Schedule and manage your maintenance appointments</p>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Open Calendar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="more" className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {user.role === 'root' && (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Organizations</h4>
                          <p className="text-sm text-gray-500">{organizations.length} organizations</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <span className="text-sm">Manage</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Vendors</h4>
                          <p className="text-sm text-gray-500">{vendors.length} vendors</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <span className="text-sm">Manage</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Settings</h4>
                      <p className="text-sm text-gray-500">App preferences</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <span className="text-sm">Open</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Smartphone className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Desktop Version</h4>
                      <p className="text-sm text-gray-500">Full web interface</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href="/">
                        <span className="text-sm">Open</span>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => setShowCreateTicket(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default MobilePage;