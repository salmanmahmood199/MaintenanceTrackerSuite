import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Monitor, 
  Zap, 
  Users, 
  Clock, 
  Shield, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  Calendar,
  MapPin,
  CreditCard,
  MessageSquare,
  Camera,
  BarChart3,
  Globe,
  Rocket,
  PlayCircle,
  Settings,
  Briefcase,
  TrendingUp,
  Layers,
  Wifi,
  Cloud,
  Database,
  Lock,
  Sparkles,
  Target,
  Award,
  Truck,
  Building,
  Wrench,
  Home,
  DollarSign
} from 'lucide-react';

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const features = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile-First Design",
      description: "Native mobile apps for iOS and Android with offline capabilities and camera integration",
      color: "from-blue-500 to-cyan-500",
      stats: "99.9% Uptime",
      screenshot: "/api/placeholder/mobile-app",
      demoTitle: "Mobile App Demo"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Role Management",
      description: "Organizations, vendors, technicians, and residential users with hierarchical permissions",
      color: "from-purple-500 to-pink-500",
      stats: "5 User Types",
      screenshot: "/api/placeholder/user-roles",
      demoTitle: "Role Management"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Updates",
      description: "Live notifications, instant status sync, and push notifications across all devices",
      color: "from-orange-500 to-red-500",
      stats: "<100ms Response",
      screenshot: "/api/placeholder/real-time",
      demoTitle: "Live Updates"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Smart Scheduling",
      description: "Google Calendar integration with AI-powered conflict detection and optimization",
      color: "from-green-500 to-emerald-500",
      stats: "Google Sync",
      screenshot: "/api/placeholder/calendar",
      demoTitle: "Calendar Integration"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Billing & Payments",
      description: "Automated invoice generation, Stripe integration, and multi-payment methods",
      color: "from-indigo-500 to-blue-500",
      stats: "Stripe Powered",
      screenshot: "/api/placeholder/billing",
      demoTitle: "Payment Processing"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description: "Real-time metrics, performance tracking, and predictive maintenance insights",
      color: "from-teal-500 to-cyan-500",
      stats: "AI Insights",
      screenshot: "/api/placeholder/analytics",
      demoTitle: "Advanced Analytics"
    }
  ];

  const workflows = [
    {
      step: 1,
      title: "Ticket Creation",
      description: "Residents create tickets with photos/videos",
      icon: <Camera className="w-6 h-6" />,
      color: "from-blue-500 to-purple-500"
    },
    {
      step: 2,
      title: "AI Assignment",
      description: "Smart routing to qualified vendors",
      icon: <Target className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      step: 3,
      title: "Marketplace Bidding",
      description: "Vendors compete with competitive bids",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-pink-500 to-red-500"
    },
    {
      step: 4,
      title: "Work Execution",
      description: "Technicians complete with photo documentation",
      icon: <Wrench className="w-6 h-6" />,
      color: "from-red-500 to-orange-500"
    },
    {
      step: 5,
      title: "Billing & Payment",
      description: "Automated invoicing and secure payments",
      icon: <CreditCard className="w-6 h-6" />,
      color: "from-orange-500 to-yellow-500"
    }
  ];

  const integrations = [
    { name: "Google Calendar", icon: <Calendar className="w-8 h-8" />, status: "Connected" },
    { name: "Stripe Payments", icon: <CreditCard className="w-8 h-8" />, status: "Active" },
    { name: "Email Notifications", icon: <MessageSquare className="w-8 h-8" />, status: "Live" },
    { name: "Mobile Push", icon: <Smartphone className="w-8 h-8" />, status: "Enabled" },
    { name: "Cloud Storage", icon: <Cloud className="w-8 h-8" />, status: "Synced" },
    { name: "Analytics API", icon: <BarChart3 className="w-8 h-8" />, status: "Running" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Operations Manager",
      company: "Metro Restaurant Group",
      quote: "TaskScout transformed our maintenance operations. 50% faster response times across all locations!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Facilities Director",
      company: "TechCorp Hotels",
      quote: "The marketplace bidding system saved us 30% on maintenance costs while improving service quality.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      role: "Store Manager",
      company: "Urban Retail Chain",
      quote: "Customers notice the difference. Our facilities are always pristine thanks to TaskScout's efficiency.",
      rating: 5
    }
  ];

  const stats = [
    { number: "50K+", label: "Tickets Processed", icon: <CheckCircle className="w-6 h-6" /> },
    { number: "2,400+", label: "Active Businesses", icon: <Users className="w-6 h-6" /> },
    { number: "99.9%", label: "Uptime", icon: <Shield className="w-6 h-6" /> },
    { number: "24/7", label: "Support", icon: <Clock className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Advanced Animated Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        
        {/* Mouse-following gradient */}
        <div 
          className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        ></div>
        
        {/* Multiple floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute top-3/4 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-2xl animate-bounce delay-2000"></div>
        <div className="absolute top-1/6 right-1/3 w-72 h-72 bg-green-500/10 rounded-full blur-2xl animate-pulse delay-1500"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <img 
            src="/assets/taskscout-logo.png" 
            alt="TaskScout Logo" 
            className="w-16 h-16 object-contain"
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            TaskScout
          </h1>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-gray-300">
          <a href="#pricing" className="hover:text-teal-300 transition-colors">
            Pricing
          </a>
          <Link href="/blogs" className="hover:text-teal-300 transition-colors">
            Blog
          </Link>
          <a href="#features" className="hover:text-teal-300 transition-colors">
            Features
          </a>
          <Link href="/contact" className="hover:text-teal-300 transition-colors">
            Contact
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Login
            </Button>
          </Link>
          <Link href="/contact">
            <Button className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative z-10 px-6 pt-32 pb-20 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-6xl mx-auto">
          <Badge className="mb-6 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30">
            <Star className="w-4 h-4 mr-2" />
            Next-Generation Maintenance Platform
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-white via-teal-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
            The Future of
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Maintenance
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Revolutionary maintenance management with two game-changing solutions: AI-powered full-cycle ticketing 
            from creation to completion, and an Uber-like marketplace connecting you with top-rated service providers instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/contact">
              <Button size="lg" className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 text-lg px-8 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 rounded-full backdrop-blur-sm"
            >
              <PlayCircle className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Advanced Floating Device Mockups with Screenshots */}
          <div className="relative mt-16">
            <div className="flex justify-center items-center space-x-12 perspective-1000">
              {/* Mobile Device */}
              <div className="transform rotate-12 hover:rotate-6 hover:scale-110 transition-all duration-700 group">
                <div className="w-72 h-[500px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-6 shadow-2xl border border-gray-700 relative overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] relative overflow-hidden">
                    {/* Mobile Screen Content */}
                    <div className="absolute inset-4 bg-gradient-to-b from-teal-900/20 to-cyan-900/20 rounded-[1.5rem] p-4">
                      {/* Status Bar */}
                      <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                        <span>9:41</span>
                        <div className="flex space-x-1">
          <div className="w-4 h-2 bg-teal-400 rounded-sm"></div>
                          <Wifi className="w-3 h-3" />
                        </div>
                      </div>
                      
                      {/* App Header */}
                      <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                          <img 
                            src="/assets/taskscout-logo.png" 
                            alt="TaskScout Logo" 
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <h3 className="text-lg font-bold">TaskScout</h3>
                      </div>
                      
                      {/* Ticket Cards Animation */}
                      <div className="space-y-3 h-80 overflow-hidden">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i}
                            className={`bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 transform transition-all duration-1000 ${
                              currentSlide === i % 4 ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-60'
                            }`}
                            style={{ animationDelay: `${i * 0.2}s` }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                                <Wrench className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-white">
                                  {i === 0 && "HVAC Repair"}
                                  {i === 1 && "Plumbing Issue"}
                                  {i === 2 && "Electrical Fix"}
                                  {i === 3 && "Flooring Replace"}
                                  {i === 4 && "Paint Touch-up"}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {i === 0 && "High Priority"}
                                  {i === 1 && "Medium Priority"}
                                  {i === 2 && "Low Priority"}
                                  {i === 3 && "In Progress"}
                                  {i === 4 && "Completed"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Floating Action Button */}
                    <div className="absolute bottom-6 right-6">
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop/Laptop Device */}
              <div className="transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-700 group">
                <div className="w-96 h-72 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-700 relative overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl relative overflow-hidden">
                    {/* Desktop Screen Content */}
                    <div className="absolute inset-3 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-4">
                      {/* Browser Bar */}
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="flex-1 bg-white/10 rounded-full h-6 flex items-center px-3">
                          <Globe className="w-3 h-3 text-gray-400 mr-2" />
                          <span className="text-xs text-gray-400">taskscout.ai/dashboard</span>
                        </div>
                      </div>
                      
                      {/* Dashboard Content */}
                      <div className="grid grid-cols-3 gap-3 h-32">
                        {/* Stats Cards */}
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-3 border border-white/10">
                          <div className="text-2xl font-bold text-blue-400">127</div>
                          <div className="text-xs text-gray-400">Active Tickets</div>
                          <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                            <div className="bg-blue-400 h-1 rounded-full w-3/4 animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-3 border border-white/10">
                          <div className="text-2xl font-bold text-green-400">94%</div>
                          <div className="text-xs text-gray-400">Completion Rate</div>
                          <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                            <div className="bg-green-400 h-1 rounded-full w-5/6 animate-pulse delay-500"></div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-white/10">
                          <div className="text-2xl font-bold text-purple-400">$47K</div>
                          <div className="text-xs text-gray-400">Monthly Revenue</div>
                          <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                            <div className="bg-purple-400 h-1 rounded-full w-4/5 animate-pulse delay-1000"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Live Activity Feed */}
                      <div className="mt-4 space-y-2 h-20 overflow-hidden">
                        {[...Array(3)].map((_, i) => (
                          <div 
                            key={i}
                            className={`flex items-center space-x-2 text-xs transform transition-all duration-1000 ${
                              currentSlide === i % 3 ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-50'
                            }`}
                          >
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-gray-300">
                              {i === 0 && "New ticket assigned to TechPro Services"}
                              {i === 1 && "Payment processed for Invoice #INV-001"}
                              {i === 2 && "Technician marked repair as completed"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tablet Device */}
              <div className="transform rotate-6 hover:rotate-3 hover:scale-105 transition-all duration-700 group">
                <div className="w-64 h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-5 shadow-2xl border border-gray-700 relative overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl relative overflow-hidden">
                    {/* Tablet Content - Calendar View */}
                    <div className="absolute inset-4 bg-gradient-to-b from-green-900/20 to-blue-900/20 rounded-xl p-3">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-white">Schedule</h3>
                        <p className="text-sm text-gray-400">Today's Appointments</p>
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 mb-4">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div key={i} className="text-center text-xs text-gray-400 py-1">
                            {day}
                          </div>
                        ))}
                        {[...Array(21)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`text-center text-xs py-1 rounded ${
                              i === 15 ? 'bg-blue-500 text-white' : 
                              i === 8 || i === 12 ? 'bg-orange-400/30 text-orange-300' : 
                              'text-gray-400'
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      
                      {/* Appointments */}
                      <div className="space-y-2">
                        {[
                          { time: "9:00 AM", task: "HVAC Inspection", color: "bg-blue-500" },
                          { time: "2:00 PM", task: "Plumbing Repair", color: "bg-orange-500" },
                          { time: "4:30 PM", task: "Electrical Check", color: "bg-purple-500" }
                        ].map((appointment, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 ${appointment.color} rounded-full animate-pulse`}></div>
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-white">{appointment.time}</div>
                              <div className="text-xs text-gray-400">{appointment.task}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Revolutionary Solutions Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Two Revolutionary Solutions
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the future of maintenance with AI-powered automation and Uber-like marketplace convenience.
            </p>
          </div>

          {/* Two Major Features */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* AI-Powered Ticketing */}
            <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-3xl p-8 backdrop-blur-sm hover:scale-105 transition-all duration-500">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                AI-Powered A-Z Ticketing
              </h3>
              <p className="text-gray-300 text-center mb-6 leading-relaxed">
                Complete maintenance lifecycle management from creation to completion. AI intelligently categorizes, prioritizes, 
                and routes tickets while tracking every step with real-time updates and automated workflows.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <span className="text-gray-300">Smart ticket creation with AI assistance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <span className="text-gray-300">Automated priority detection and routing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <span className="text-gray-300">Real-time progress tracking and updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  <span className="text-gray-300">Complete work order and invoice management</span>
                </div>
              </div>
            </div>

            {/* Uber-Like Marketplace */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-sm hover:scale-105 transition-all duration-500">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Uber-Like Marketplace
              </h3>
              <p className="text-gray-300 text-center mb-6 leading-relaxed">
                Instant connections with qualified service providers through competitive bidding. Get multiple quotes in minutes, 
                compare ratings and prices, then choose the perfect vendor for your maintenance needs.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">Instant competitive bidding system</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">Verified vendor ratings and reviews</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">Transparent pricing and negotiations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">Fast vendor selection and scheduling</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Types Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Commercial */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-center mb-4">
                <Building className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-2xl font-bold text-emerald-400">Commercial Businesses</h4>
                <p className="text-gray-300 text-sm">Restaurants • Gas Stations • Hotels • Retail Stores</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-300">Full A-Z maintenance ticketing system</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-300">Option to use marketplace or direct vendors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-300">Advanced reporting and analytics</span>
                </div>
              </div>
            </div>

            {/* Residential */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-center mb-4">
                <Home className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h4 className="text-2xl font-bold text-amber-400">Residential Users</h4>
                <p className="text-gray-300 text-sm">Homeowners • Renters • Property Managers</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-gray-300">Simple Uber-like experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-gray-300">Automatic marketplace posting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-gray-300">Instant vendor quotes and booking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Pricing Section */}
          <div id="pricing" className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-8 backdrop-blur-sm text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Transparent Pricing That Works
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              We believe in simple, fair pricing. Commercial businesses and residential users never pay platform fees.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-center mb-4">
                  <Building className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                  <h4 className="text-xl font-bold text-white">Commercial</h4>
                </div>
                <div className="text-3xl font-bold text-teal-400 mb-2">FREE</div>
                <div className="text-gray-400">No platform fees ever</div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-center mb-4">
                  <Home className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <h4 className="text-xl font-bold text-white">Residential</h4>
                </div>
                <div className="text-3xl font-bold text-amber-400 mb-2">FREE</div>
                <div className="text-gray-400">No platform fees ever</div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-center mb-4">
                  <Wrench className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h4 className="text-xl font-bold text-white">Vendors</h4>
                </div>
                <div className="text-3xl font-bold text-purple-400 mb-2">$99</div>
                <div className="text-gray-400">Per month flat rate</div>
              </div>
            </div>
            
            <p className="text-gray-400 mt-6 text-sm">
              Vendors pay one simple monthly fee to access unlimited customers and grow their business through our marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Features Grid with Screenshots */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything you need to manage maintenance operations efficiently, 
              from initial request to final billing with AI-powered automation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/10 border border-white/20 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-700 transform hover:scale-105 ${
                  activeFeature === index ? 'ring-2 ring-blue-400/50 shadow-2xl' : ''
                }`}
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30">
                      {feature.stats}
                    </Badge>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-6">{feature.description}</p>
                  
                  {/* Interactive Demo Window */}
                  <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-white/10 group-hover:border-white/20 transition-all duration-500">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="flex-1 bg-white/10 rounded-full h-5 flex items-center px-3">
                        <span className="text-xs text-gray-400">{feature.demoTitle}</span>
                      </div>
                    </div>
                    
                    {/* Dynamic content based on feature */}
                    <div className="h-32 relative overflow-hidden rounded-lg">
                      {index === 0 && (
                        // Mobile App Demo
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center">
                          <div className="text-center">
                            <Smartphone className="w-12 h-12 text-blue-400 mx-auto mb-2 animate-bounce" />
                            <div className="text-sm text-white mb-1">Native iOS & Android Apps</div>
                            <div className="text-xs text-gray-400">Offline sync • Camera integration • Push notifications</div>
                          </div>
                        </div>
                      )}
                      
                      {index === 1 && (
                        // User Roles Demo
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-3">
                          <div className="grid grid-cols-2 gap-2 h-full">
                            {['Organizations', 'Vendors', 'Technicians', 'Residents'].map((role, i) => (
                              <div key={i} className={`bg-white/10 rounded p-2 flex items-center justify-center text-xs transition-all duration-300 ${
                                currentSlide === i ? 'bg-purple-500/30 scale-105' : ''
                              }`}>
                                <Users className="w-3 h-3 mr-1" />
                                {role}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {index === 2 && (
                        // Real-time Updates Demo
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 to-red-900/30 p-3">
                          <div className="space-y-2">
                            {[...Array(4)].map((_, i) => (
                              <div 
                                key={i}
                                className={`flex items-center space-x-2 text-xs transform transition-all duration-500 ${
                                  currentSlide === i ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-40'
                                }`}
                              >
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-gray-300">
                                  {i === 0 && "New ticket assigned"}
                                  {i === 1 && "Status updated to 'In Progress'"}
                                  {i === 2 && "Technician en route"}
                                  {i === 3 && "Work completed"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {index === 3 && (
                        // Calendar Integration Demo
                        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-3">
                          <div className="grid grid-cols-7 gap-1">
                            {[...Array(21)].map((_, i) => (
                              <div 
                                key={i}
                                className={`h-4 text-xs flex items-center justify-center rounded ${
                                  i === 15 ? 'bg-green-500 text-white' :
                                  i === 8 || i === 12 ? 'bg-blue-400/50 text-blue-200' :
                                  'text-gray-400'
                                }`}
                              >
                                {i + 1}
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-300">Google Calendar Sync Active</span>
                          </div>
                        </div>
                      )}
                      
                      {index === 4 && (
                        // Billing Demo
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-blue-900/30 p-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-300">Invoice #INV-001</span>
                              <span className="text-xs text-green-400">PAID</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                              <div className="bg-blue-400 h-2 rounded-full w-full animate-pulse"></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-blue-400 font-bold">$1,250</div>
                                <div className="text-gray-400">Labor</div>
                              </div>
                              <div className="text-center">
                                <div className="text-purple-400 font-bold">$380</div>
                                <div className="text-gray-400">Parts</div>
                              </div>
                              <div className="text-center">
                                <div className="text-green-400 font-bold">$1,630</div>
                                <div className="text-gray-400">Total</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {index === 5 && (
                        // Analytics Demo
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 to-cyan-900/30 p-3">
                          <div className="grid grid-cols-2 gap-2 h-full">
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400">Response Time</div>
                              <div className="text-lg font-bold text-teal-400">2.4h</div>
                              <div className="w-full bg-white/20 rounded-full h-1">
                                <div className="bg-teal-400 h-1 rounded-full w-3/4 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400">Satisfaction</div>
                              <div className="text-lg font-bold text-cyan-400">98%</div>
                              <div className="w-full bg-white/20 rounded-full h-1">
                                <div className="bg-cyan-400 h-1 rounded-full w-5/6 animate-pulse delay-500"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Visualization */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              How TaskScout Works
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From ticket creation to payment completion, experience the seamless workflow 
              that revolutionizes maintenance management.
            </p>
          </div>

          <div className="relative">
            {/* Workflow Steps */}
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8">
              {workflows.map((step, index) => (
                <div key={index} className="flex-1 relative">
                  <div className={`group cursor-pointer transform transition-all duration-500 hover:scale-110 ${
                    currentSlide === index ? 'scale-110' : ''
                  }`}>
                    {/* Step Number */}
                    <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-2xl ${
                      currentSlide === index ? 'animate-pulse' : ''
                    }`}>
                      {step.step}
                    </div>
                    
                    {/* Step Icon */}
                    <div className={`w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all duration-300 ${
                      currentSlide === index ? 'bg-white/20 scale-110' : ''
                    }`}>
                      {step.icon}
                    </div>
                    
                    {/* Step Content */}
                    <div className="text-center">
                      <h3 className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                        currentSlide === index ? 'text-blue-300' : 'text-white'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Connection Line */}
                  {index < workflows.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-white/30 to-transparent transform translate-x-4"></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Animated Flow Line */}
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Integrations Showcase */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Connect with your favorite tools and services for a unified maintenance ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {integrations.map((integration, index) => (
              <div 
                key={index}
                className={`group relative bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 cursor-pointer ${
                  activeFeature === index ? 'ring-2 ring-blue-400/50 scale-110' : ''
                }`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    {integration.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {integration.name}
                  </h3>
                  <Badge className={`text-xs ${
                    integration.status === 'Connected' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                    integration.status === 'Active' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    integration.status === 'Live' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                    integration.status === 'Enabled' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    integration.status === 'Synced' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                    'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  }`}>
                    {integration.status}
                  </Badge>
                </div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Showcase */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Multi-Platform Experience
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Seamless experience across web, iOS, and Android with real-time synchronization
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Web Platform */}
            <div className="group">
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-8 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-500">
                <div className="flex items-center mb-6">
                  <Monitor className="w-8 h-8 text-blue-400 mr-4" />
                  <h3 className="text-2xl font-bold">Web Dashboard</h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Complete admin interface
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Bulk operations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Detailed reporting
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Platform */}
            <div className="group">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-500">
                <div className="flex items-center mb-6">
                  <Smartphone className="w-8 h-8 text-purple-400 mr-4" />
                  <h3 className="text-2xl font-bold">Mobile Apps</h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Native iOS & Android
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Offline capabilities
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Camera integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Push notifications
                  </li>
                </ul>
              </div>
            </div>

            {/* Integration */}
            <div className="group">
              <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-3xl p-8 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-500">
                <div className="flex items-center mb-6">
                  <Globe className="w-8 h-8 text-green-400 mr-4" />
                  <h3 className="text-2xl font-bold">Integrations</h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Google Calendar sync
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Email notifications
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    Payment processing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    API access
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-300 mb-6 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                    <div className="text-sm text-blue-400">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl p-12 border border-white/10 backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Ready to Transform Your Maintenance Operations?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of businesses who've revolutionized their maintenance operations with TaskScout's AI-powered platform and marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg px-12 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-12 py-4 rounded-full backdrop-blur-sm">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/assets/taskscout-logo.png" 
                alt="TaskScout Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                TaskScout
              </span>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-teal-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-teal-300 transition-colors">Terms of Service</Link>
              <Link href="/support" className="text-gray-400 hover:text-teal-300 transition-colors">Support</Link>
              <span className="text-gray-400">© 2025 TaskScout. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}