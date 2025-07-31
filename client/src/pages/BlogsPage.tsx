import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { blogPosts } from "@/data/blogPosts";
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
  ArrowLeft,
} from "lucide-react";

export default function BlogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    "all",
    "AI Technology",
    "Business Solutions",
    "HVAC Systems",
    "Electrical Systems",
    "IoT Technology",
    "Industry Trends",
  ];

  // Filter posts based on search term and category
  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header Section */}
      <div className="relative z-10 px-6 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/">
            <Button
              variant="ghost"
              className="mb-8 text-gray-300 hover:text-white"
            >
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

            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover the latest trends in HVAC, plumbing, AI technology, and
              business solutions that are transforming commercial maintenance
              operations across industries.
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search articles by title, content, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-none"
                      : "border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                  }
                >
                  {category === "all" ? "All Categories" : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          {(searchTerm || selectedCategory !== "all") && (
            <div className="mb-8">
              <p className="text-gray-300">
                Found {filteredPosts.length} article
                {filteredPosts.length !== 1 ? "s" : ""}
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCategory !== "all" && ` in ${selectedCategory}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="relative z-10 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-colors group"
              >
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>

                  <Badge className="mb-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-500/30">
                    {post.category}
                  </Badge>

                  <h3 className="text-xl mb-3 text-white group-hover:text-teal-300 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      By {post.author}
                    </span>
                    <Link href={`/blog/${post.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-teal-300 hover:text-teal-200 hover:bg-teal-500/10"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  No articles found
                </h3>
                <p>Try adjusting your search terms or category filter.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="border-white/20 text-gray-300 hover:text-white"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="relative z-10 px-6 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 backdrop-blur-sm border border-teal-500/20 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Ready to Transform Your Maintenance Operations?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of businesses using TaskScout's AI-powered
              maintenance platform to reduce costs, improve efficiency, and
              prevent downtime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-none px-8"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10 px-8"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
    </div>
  );
}
