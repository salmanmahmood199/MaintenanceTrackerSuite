import React, { useState, useEffect } from 'react';
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
  PlayCircle
} from 'lucide-react';

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile-First Design",
      description: "Native mobile apps for iOS and Android with offline capabilities",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Role Management",
      description: "Organizations, vendors, technicians, and residential users",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Updates",
      description: "Live notifications and instant status synchronization",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Smart Scheduling",
      description: "Google Calendar integration with conflict detection",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Billing & Payments",
      description: "Automated invoice generation and payment processing",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description: "Comprehensive reporting and performance metrics",
      color: "from-teal-500 to-cyan-500"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Property Manager",
      company: "Metro Properties",
      quote: "TaskScout transformed our maintenance operations. 50% faster response times!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Maintenance Director",
      company: "TechCorp Facilities",
      quote: "The marketplace bidding system saved us 30% on maintenance costs.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      role: "Operations Manager",
      company: "Urban Living",
      quote: "Residents love the mobile app. Satisfaction scores increased dramatically.",
      rating: 5
    }
  ];

  const stats = [
    { number: "50K+", label: "Tickets Processed", icon: <CheckCircle className="w-6 h-6" /> },
    { number: "1,200+", label: "Active Users", icon: <Users className="w-6 h-6" /> },
    { number: "99.9%", label: "Uptime", icon: <Shield className="w-6 h-6" /> },
    { number: "24/7", label: "Support", icon: <Clock className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TaskScout
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative z-10 px-6 py-20 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-6xl mx-auto">
          <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30">
            <Star className="w-4 h-4 mr-2" />
            Next-Generation Maintenance Platform
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
            The Future of
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Maintenance
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Revolutionize your property maintenance with AI-powered automation, 
            real-time collaboration, and seamless mobile experiences across web and native apps.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg px-8 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
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

          {/* Floating Device Mockups */}
          <div className="relative">
            <div className="flex justify-center items-center space-x-8">
              <div className="transform rotate-12 hover:rotate-6 transition-transform duration-500">
                <div className="w-64 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-4 shadow-2xl border border-gray-700">
                  <div className="w-full h-full bg-gradient-to-b from-blue-900 to-purple-900 rounded-2xl flex flex-col items-center justify-center">
                    <Smartphone className="w-16 h-16 text-blue-400 mb-4" />
                    <p className="text-sm font-semibold">Mobile App</p>
                    <p className="text-xs text-gray-400 mt-2">iOS & Android</p>
                  </div>
                </div>
              </div>
              
              <div className="transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="w-80 h-64 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-700">
                  <div className="w-full h-full bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl flex flex-col items-center justify-center">
                    <Monitor className="w-20 h-20 text-purple-400 mb-4" />
                    <p className="text-lg font-semibold">Web Dashboard</p>
                    <p className="text-sm text-gray-400 mt-2">Full-Featured Admin Panel</p>
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

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything you need to manage maintenance operations efficiently, 
              from initial request to final billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group"
              >
                <CardContent className="p-8">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
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
      <section className="relative z-10 px-6 py-20">
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
              Join thousands of property managers who've revolutionized their maintenance workflow with TaskScout
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/register">
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                TaskScout
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 TaskScout. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}