import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Building,
  MapPin,
  Users,
  Wrench,
  TrendingUp,
  Shield,
  Smartphone,
  Star,
  Rocket,
  ArrowLeft
} from 'lucide-react';

export default function BlogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogPosts = [
    {
      id: 1,
      title: "Washington DC Property Management: The Complete Guide to Maintenance Excellence",
      excerpt: "Discover how TaskScout is revolutionizing property management in the nation's capital with comprehensive maintenance solutions for DC's diverse real estate market.",
      content: "Washington DC's property management landscape presents unique challenges...",
      author: "Sarah Johnson",
      date: "2024-01-15",
      readTime: "8 min read",
      category: "Property Management",
      tags: ["Washington DC", "Property Management", "Maintenance", "Real Estate"],
      image: "/api/placeholder/blog-dc-property",
      featured: true
    },
    {
      id: 2,
      title: "Northern Virginia Apartment Maintenance: Best Practices for Property Managers",
      excerpt: "Learn how NOVA property managers are streamlining maintenance operations with digital solutions and vendor management systems.",
      content: "Northern Virginia's competitive rental market demands efficient maintenance...",
      author: "Michael Chen",
      date: "2024-01-12",
      readTime: "6 min read",
      category: "Maintenance",
      tags: ["Northern Virginia", "Apartments", "Maintenance", "Property Managers"],
      image: "/api/placeholder/blog-nova-apartments",
      featured: false
    },
    {
      id: 3,
      title: "Maryland Commercial Property Maintenance: Technology Solutions That Work",
      excerpt: "Explore how Maryland commercial property owners are leveraging TaskScout to reduce costs and improve tenant satisfaction.",
      content: "Maryland's commercial property sector is embracing technology...",
      author: "Jennifer Davis",
      date: "2024-01-10",
      readTime: "7 min read",
      category: "Commercial",
      tags: ["Maryland", "Commercial Property", "Technology", "Tenant Satisfaction"],
      image: "/api/placeholder/blog-maryland-commercial",
      featured: false
    },
    {
      id: 4,
      title: "DMV Area Vendor Management: Building Strong Maintenance Networks",
      excerpt: "How property managers across DC, Maryland, and Virginia are creating efficient vendor networks with digital marketplace solutions.",
      content: "The DMV area's diverse property landscape requires robust vendor networks...",
      author: "Robert Wilson",
      date: "2024-01-08",
      readTime: "5 min read",
      category: "Vendor Management",
      tags: ["DMV Area", "Vendor Management", "Marketplace", "Network Building"],
      image: "/api/placeholder/blog-dmv-vendors",
      featured: true
    },
    {
      id: 5,
      title: "Arlington Property Maintenance Trends: What's Changing in 2024",
      excerpt: "Stay ahead of Arlington's property maintenance trends with insights into emerging technologies and resident expectations.",
      content: "Arlington's property market continues to evolve...",
      author: "Lisa Rodriguez",
      date: "2024-01-05",
      readTime: "6 min read",
      category: "Trends",
      tags: ["Arlington", "Trends", "2024", "Technology", "Residents"],
      image: "/api/placeholder/blog-arlington-trends",
      featured: false
    },
    {
      id: 6,
      title: "Montgomery County Housing: Streamlining Maintenance for Affordable Housing",
      excerpt: "Discover how TaskScout is helping Montgomery County affordable housing providers deliver quality maintenance services efficiently.",
      content: "Montgomery County's affordable housing sector faces unique challenges...",
      author: "David Thompson",
      date: "2024-01-03",
      readTime: "7 min read",
      category: "Affordable Housing",
      tags: ["Montgomery County", "Affordable Housing", "Efficiency", "Community"],
      image: "/api/placeholder/blog-montgomery-housing",
      featured: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All Articles', count: blogPosts.length },
    { id: 'property-management', name: 'Property Management', count: 2 },
    { id: 'maintenance', name: 'Maintenance', count: 3 },
    { id: 'commercial', name: 'Commercial', count: 1 },
    { id: 'vendor-management', name: 'Vendor Management', count: 1 },
    { id: 'trends', name: 'Trends', count: 1 }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           post.category.toLowerCase().replace(' ', '-') === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src="/assets/taskscout-logo.png" 
                  alt="TaskScout Logo" 
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    TaskScout Blog
                  </h1>
                  <p className="text-gray-400">DMV Area Property Management Insights</p>
                </div>
              </div>
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-6 py-12">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Property Management Insights
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Expert advice, industry trends, and best practices for property managers 
              across Washington DC, Maryland, and Northern Virginia.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search articles about maintenance, property management, DMV area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-full text-lg"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`rounded-full ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : "border-white/30 text-white hover:bg-white/10"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Featured Articles
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="group bg-gradient-to-br from-white/5 to-white/10 border-white/20 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-500 transform hover:scale-105">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-t-lg flex items-center justify-center mb-6">
                      <div className="text-center">
                        <Building className="w-16 h-16 text-blue-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Featured Article</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {post.category}
                        </Badge>
                        <div className="flex items-center text-gray-400 text-sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(post.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                      <h4 className="text-xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-gray-400 mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-gray-300 text-sm">{post.author}</span>
                        </div>
                        <Button variant="ghost" className="text-blue-400 hover:text-blue-300 p-0">
                          Read More <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* All Articles */}
        <section className="px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              All Articles ({filteredPosts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="group bg-gradient-to-br from-white/5 to-white/10 border-white/20 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center">
                        {post.category === 'Property Management' && <Building className="w-12 h-12 text-blue-400 mx-auto" />}
                        {post.category === 'Maintenance' && <Wrench className="w-12 h-12 text-orange-400 mx-auto" />}
                        {post.category === 'Commercial' && <TrendingUp className="w-12 h-12 text-green-400 mx-auto" />}
                        {post.category === 'Vendor Management' && <Users className="w-12 h-12 text-purple-400 mx-auto" />}
                        {post.category === 'Trends' && <Star className="w-12 h-12 text-yellow-400 mx-auto" />}
                        {post.category === 'Affordable Housing' && <Shield className="w-12 h-12 text-cyan-400 mx-auto" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {post.category}
                      </Badge>
                      <div className="flex items-center text-gray-400 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-3 text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                    
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-white/20 text-gray-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-400 text-xs">{post.author}</span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl p-12 border border-white/10 backdrop-blur-sm">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Ready to Transform Your Property Management?
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Join property managers across the DMV area who've revolutionized their maintenance operations with TaskScout
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg px-12 py-4 rounded-full">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-12 py-4 rounded-full">
                    Learn More
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
        <footer className="px-6 py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
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
                © 2024 TaskScout. All rights reserved. Serving the Washington DC Metro Area.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}