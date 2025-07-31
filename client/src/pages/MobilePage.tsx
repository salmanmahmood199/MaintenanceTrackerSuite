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
        const errorData = await response.json();
        console.error('Login failed:', errorData.message);
        alert('Login failed: ' + errorData.message);
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
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-2">Quick Login Options:</p>
              <div className="space-y-1 text-xs text-blue-800">
                <div><strong>Root Admin:</strong> root@mail.com / admin</div>
                <div><strong>Org Admin:</strong> admin@nsrpetroservices.org / password</div>
                <div><strong>Sub Admin:</strong> placeticket@nsrpetro.com / password</div>
              </div>
            </div>
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
              
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 text-xs p-2 h-8"
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
                  className="flex-1 text-xs p-2 h-8"
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
                  className="flex-1 text-xs p-2 h-8"
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
                className="w-full text-base py-6"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
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
    <div className="min-h-screen bg-background">
      {/* Mobile Header - Dark Theme */}
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
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                setUser(null);
              }}
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
            <p className="text-blue-100 text-sm capitalize">{user.role.replace('_', ' ')}</p>
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

      {/* Stats Cards - Matching Web Style */}
      <div className="px-4 -mt-8 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Tickets</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{tickets.length}</p>
                </div>
                <div className="bg-blue-500/10 p-2.5 rounded-lg">
                  <Ticket className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
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
      </div>

      {/* Main Content */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 backdrop-blur-sm border border-border rounded-lg p-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Home className="h-4 w-4" />
              <span className="text-xs font-medium">Home</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center space-x-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Ticket className="h-4 w-4" />
              <span className="text-xs font-medium">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="more" className="flex items-center space-x-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <List className="h-4 w-4" />
              <span className="text-xs font-medium">More</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Actions - Dark Theme Style */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    className="h-20 flex flex-col space-y-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                    onClick={() => setShowCreateTicket(true)}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-sm font-medium">Create Ticket</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col space-y-2 border-border hover:bg-muted"
                    onClick={() => setActiveTab('tickets')}
                  >
                    <Search className="h-6 w-6" />
                    <span className="text-sm font-medium">Search</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col space-y-2 border-border hover:bg-muted"
                    onClick={() => setActiveTab('calendar')}
                  >
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm font-medium">Schedule</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col space-y-2 border-border hover:bg-muted"
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-sm font-medium">Quick Photo</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tickets - Styled like Web */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span>Recent Tickets</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('tickets')} className="text-muted-foreground hover:text-foreground">
                    <span className="text-sm">View All</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {tickets.slice(0, 3).map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="bg-primary/10 p-2.5 rounded-lg">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {ticket.title}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge className={`text-xs px-2.5 py-1 ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2 hover:bg-muted">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {tickets.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-base mb-4">No tickets yet</p>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => setShowCreateTicket(true)}
                    >
                      Create First Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            {/* Search Bar - Dark Theme */}
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tickets..." 
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Button variant="outline" size="icon" className="border-border hover:bg-muted">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Tickets List - Web Style */}
            <ScrollArea className="h-[65vh]">
              <div className="space-y-4">
                {tickets.map((ticket: any) => (
                  <Card key={ticket.id} className="bg-card border-border hover:bg-muted/20 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground text-base mb-2">
                            {ticket.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {ticket.description}
                          </p>
                        </div>
                        <div className="ml-3 flex flex-col items-end space-y-2">
                          <Badge className={`text-xs px-3 py-1 ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority} priority
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-3 border-t border-border">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>#{ticket.id}</span>
                          </div>
                          {ticket.images && ticket.images.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Image className="h-3 w-3" />
                              <span>{ticket.images.length}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-4">
                        <Button variant="ghost" size="sm" className="h-8 px-3 hover:bg-muted">
                          <Eye className="h-3 w-3 mr-1.5" />
                          <span className="text-xs">View</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-3 hover:bg-muted">
                          <MessageSquare className="h-3 w-3 mr-1.5" />
                          <span className="text-xs">Comment</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {tickets.length === 0 && (
                  <Card className="bg-card border-border">
                    <CardContent className="p-12 text-center">
                      <Ticket className="h-16 w-16 mx-auto mb-6 text-muted-foreground/30" />
                      <h3 className="font-semibold text-foreground mb-3 text-lg">No tickets found</h3>
                      <p className="text-muted-foreground mb-6">Get started by creating your first maintenance ticket</p>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={() => setShowCreateTicket(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-6 text-muted-foreground/30" />
                <h3 className="font-semibold text-foreground mb-3 text-lg">Calendar View</h3>
                <p className="text-muted-foreground mb-6">Schedule and manage your maintenance appointments</p>
                <Button variant="outline" className="border-border hover:bg-muted" asChild>
                  <a href="/calendar">
                    <Calendar className="h-4 w-4 mr-2" />
                    Open Calendar
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="more" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {user.role === 'root' && (
                <>
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-500/10 p-3 rounded-lg">
                          <Building className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">Organizations</h4>
                          <p className="text-sm text-muted-foreground">{organizations.length} organizations</p>
                        </div>
                        <Button variant="ghost" size="sm" className="hover:bg-muted">
                          <span className="text-sm">Manage</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center space-x-4">
                        <div className="bg-purple-500/10 p-3 rounded-lg">
                          <Users className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">Vendors</h4>
                          <p className="text-sm text-muted-foreground">{vendors.length} vendors</p>
                        </div>
                        <Button variant="ghost" size="sm" className="hover:bg-muted">
                          <span className="text-sm">Manage</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-500/10 p-3 rounded-lg">
                      <Settings className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">Settings</h4>
                      <p className="text-sm text-muted-foreground">App preferences</p>
                    </div>
                    <Button variant="ghost" size="sm" className="hover:bg-muted">
                      <span className="text-sm">Open</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-center space-x-4">
                    <div className="bg-orange-500/10 p-3 rounded-lg">
                      <Smartphone className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">Desktop Version</h4>
                      <p className="text-sm text-muted-foreground">Full web interface</p>
                    </div>
                    <Button variant="ghost" size="sm" className="hover:bg-muted" asChild>
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

      {/* Floating Action Button - Web Style */}
      <div className="fixed bottom-8 right-6 z-50">
        <Button 
          size="lg"
          className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-2 border-background/20 backdrop-blur-sm"
          onClick={() => setShowCreateTicket(true)}
        >
          <Plus className="h-7 w-7" />
        </Button>
      </div>

      {/* Bottom Padding for Floating Button */}
      <div className="h-24"></div>
    </div>
  );
};

export default MobilePage;