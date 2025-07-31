import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Smartphone, User, Settings, Plus, List } from 'lucide-react';

const MobilePage = () => {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState('root@mail.com');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">TaskScout</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="p-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">Welcome, {user.firstName}!</h2>
                <p className="text-sm text-gray-600">Role: {user.role}</p>
                {user.organizationId && (
                  <p className="text-xs text-gray-500">Organization ID: {user.organizationId}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Plus className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium">Create Ticket</h4>
              <p className="text-xs text-gray-600 mt-1">New maintenance request</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <List className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium">View Tickets</h4>
              <p className="text-xs text-gray-600 mt-1">Manage existing tickets</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium">Settings</h4>
              <p className="text-xs text-gray-600 mt-1">Manage preferences</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Smartphone className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium">Full App</h4>
              <p className="text-xs text-gray-600 mt-1">
                <a href="/" className="text-blue-600 underline">
                  Open Desktop Version
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Info */}
      <div className="p-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Mobile App Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Connected to:</span>
                <span className="text-green-600">✓ TaskScout Server</span>
              </div>
              <div className="flex justify-between">
                <span>Authentication:</span>
                <span className="text-green-600">✓ Session Active</span>
              </div>
              <div className="flex justify-between">
                <span>Mobile Interface:</span>
                <span className="text-green-600">✓ Web Version</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobilePage;