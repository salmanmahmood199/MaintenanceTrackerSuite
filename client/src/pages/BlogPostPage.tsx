import React from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blogPosts } from "@/data/blogPosts";
import { Calendar, Clock, Users, ArrowLeft, BookOpen } from "lucide-react";

// Helper function to get appropriate images for each category
const getPostImage = (category: string) => {
  switch (category) {
    case "AI Technology":
      return "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop&auto=format";
    case "Business Solutions":
      return "https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=800&h=400&fit=crop&auto=format";
    case "HVAC Systems":
      return "https://images.unsplash.com/photo-1558618666-fbd6c327e0fc?w=800&h=400&fit=crop&auto=format";
    case "Electrical Systems":
      return "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=400&fit=crop&auto=format";
    case "IoT Technology":
      return "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&auto=format";
    case "Industry Trends":
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&auto=format";
    case "Plumbing Solutions":
      return "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=400&fit=crop&auto=format";
    default:
      return "https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=800&h=400&fit=crop&auto=format";
  }
};

export default function BlogPostPage() {
  const [match, params] = useRoute("/blog/:id");

  if (!match || !params?.id) {
    return <div>Blog post not found</div>;
  }

  const post = blogPosts.find((p) => p.id === parseInt(params.id));

  if (!post) {
    return <div>Blog post not found</div>;
  }

  const formatContent = (content: string) => {
    return content
      .split("\n\n")
      .map((paragraph, index) => {
        if (paragraph.startsWith("## ")) {
          return (
            <h2 key={index} className="  text-white mb-4 mt-6 border-b  pb-2">
              {paragraph.replace("## ", "")}
            </h2>
          );
        } else if (paragraph.startsWith("### ")) {
          return (
            <h3 key={index} className="text-base  text-white mb-3 mt-10">
              {paragraph.replace("### ", "")}
            </h3>
          );
        } else if (paragraph.startsWith("#### ")) {
          return (
            <h4 key={index} className="text-base  text-md mb-3 mt-10">
              {paragraph.replace("#### ", "")}
            </h4>
          );
        } else if (
          paragraph.startsWith("**") &&
          paragraph.endsWith("**") &&
          !paragraph.includes(":**")
        ) {
          // Handle standalone bold headings
          return (
            <h4 key={index} className="    mb-2 mt-10">
              {paragraph.replace(/\*\*/g, "")}
            </h4>
          );
        } else if (paragraph.match(/^\d+\.\s/)) {
          // Handle numbered lists
          const listItems = paragraph
            .split(/\n\d+\.\s/)
            .filter((item) => item.trim());
          const firstItem = paragraph.match(/^\d+\.\s(.+)/)?.[1];
          if (firstItem) listItems.unshift(firstItem);
          return (
            <ol
              key={index}
              className="list-decimal list-inside text- mb-4 space-y-2 mt-10"
            >
              {listItems.map((item, i) => (
                <li key={i} className="leading-relaxed  ">
                  {item.trim()}
                </li>
              ))}
            </ol>
          );
        } else if (paragraph.startsWith("- ")) {
          // Handle bullet lists
          const listItems = paragraph
            .split("\n- ")
            .map((item) => item.replace(/^- /, ""));
          return (
            <ul
              key={index}
              className="list-disc list-inside text- mb-4 space-y-2 mt-10"
            >
              {listItems.map((item, i) => (
                <li key={i} className="leading-relaxed text-lg mt-10">
                  {item}
                </li>
              ))}
            </ul>
          );
        } else if (
          paragraph.includes("**") &&
          (paragraph.includes(":**") || paragraph.includes("**"))
        ) {
          // Handle definition-style paragraphs and inline citations
          const parts = paragraph.split(/(\*\*[^*]+\*\*|\[\d+\])/);
          return (
            <p key={index} className="mb-3 leading-relaxed  mt-10">
              {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <span key={i} className="text-white  ">
                      {part.replace(/\*\*/g, "")}
                    </span>
                  );
                } else if (part.match(/^\[\d+\]$/)) {
                  return (
                    <span key={i} className="  ">
                      {part}
                    </span>
                  );
                } else {
                  return part;
                }
              })}
            </p>
          );
        } else if (paragraph.trim().length === 0) {
          return null; // Skip empty paragraphs
        } else {
          return (
            <p key={index} className=" mb-3 leading-relaxed mt-10">
              {paragraph}
            </p>
          );
        }
      })
      .filter((element) => element !== null); // Remove null elements
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="relative z-10 px-6 pt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/blogs">
            <Button
              variant="ghost"
              className="mb-8 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <Badge
              variant="outline"
              className="border-teal-500/30 text-teal-300 mb-4"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {post.category}
            </Badge>

            <h1 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center space-x-6 text-gray-400 text-xs mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {post.date}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.readTime}
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Image */}
          <div className="mb-8">
            <img
              src={post.image || getPostImage(post.category)}
              alt={post.title}
              className="w-full h-64 md:h-80 object-cover rounded-xl border border-white/10"
            />
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-xl p-5 md:p-6">
            <article className="max-w-none">
              {formatContent(post.content)}

              {/* References Section */}
              {post.references && post.references.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/20">
                  <h4 className="text-base  text-white mb-4">References</h4>
                  <div className="space-y-2">
                    {post.references.map((ref, index) => (
                      <p
                        key={index}
                        className="text-xs text-gray-400 leading-relaxed"
                      >
                        {ref}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>

          {/* Related Articles */}
          <div className="mt-12">
            <h3 className="text-lg text-white mb-4">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogPosts
                .filter((p) => p.id !== post.id && p.category === post.category)
                .slice(0, 2)
                .map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`}>
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-lg p-6 hover:border-teal-500/30 transition-all duration-300 cursor-pointer">
                      <Badge
                        variant="outline"
                        className="border-teal-500/30 text-teal-300 mb-3"
                      >
                        {relatedPost.category}
                      </Badge>
                      <h4 className="text-sm   text-white mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h4>
                      <p className="text-gray-400 text-xs line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-4">
                        <Clock className="w-3 h-3 mr-1" />
                        {relatedPost.readTime}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
      </div>
    </div>
  );
}
