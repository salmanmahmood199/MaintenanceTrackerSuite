import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { blogPosts } from '@/data/blogPosts';
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

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header Section */}
      <div className="relative z-10 px-6 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-8 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30">
              <Rocket className="w-4 h-4 mr-2" />
              Commercial Maintenance Industry Insights
            </Badge>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white via-teal-200 to-cyan-200 bg-clip-text text-transparent">
              Maintenance Insights
            </h1>
            
            <p className="text-base text-gray-300 max-w-3xl mx-auto mb-8">
              Expert insights on HVAC systems, plumbing solutions, AI technology, and business solutions. 
              Stay ahead with industry trends and proven strategies.
            </p>

            {/* Search and Filter Section */}
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search articles, topics, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-teal-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-3 justify-center">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className={`capitalize ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                        : 'border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Results Summary */}
              <p className="text-gray-400 text-center">
                {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-300 mb-2">No articles found</h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search terms or category filter
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
      </div>
    </div>
  );
}

function BlogPostCard({ post }: { post: any }) {
  const getCardImage = (category: string) => {
    switch (category) {
      case 'AI Technology':
        return 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop&auto=format';
      case 'Business Solutions':
        return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&auto=format';
      case 'HVAC Systems':
        return 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=200&fit=crop&auto=format';
      case 'Electrical Systems':
        return 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=200&fit=crop&auto=format';
      case 'IoT Technology':
        return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&auto=format';
      default:
        return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&auto=format';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10 hover:border-teal-500/30 transition-all duration-300 group cursor-pointer overflow-hidden">
      <div className="relative">
        <img 
          src={getCardImage(post.category)} 
          alt={post.title}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
      </div>
      <CardContent className="p-5">
        <div className="mb-4">
          <Badge variant="outline" className="border-teal-500/30 text-teal-300 mb-3">
            {post.category}
          </Badge>
          <h3 className="text-sm font-semibold text-white mb-3 group-hover:text-teal-300 transition-colors line-clamp-2 leading-tight">
            {post.title}
          </h3>
          <p className="text-gray-400 text-xs line-clamp-3 mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span className="text-xs">{post.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span className="text-xs">{post.readTime}</span>
            </div>
          </div>
        </div>

        <Link href={`/blog/${post.id}`}>
          <Button
            variant="ghost"
            className="w-full justify-between text-teal-300 hover:text-white hover:bg-teal-500/10"
          >
            Read Full Article
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}