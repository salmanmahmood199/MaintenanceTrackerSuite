import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send, Image as ImageIcon, Edit2, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Ticket } from "@shared/schema";

interface TicketCommentsProps {
  ticket: Ticket;
  userRole?: string;
  userId?: number;
}

interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  content: string;
  images?: string[];
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export function TicketComments({ ticket, userRole, userId }: TicketCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewIndex, setImagePreviewIndex] = useState(0);
  const [imagePreviewImages, setImagePreviewImages] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: [`/api/tickets/${ticket.id}/comments`],
    retry: false,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; images: File[] }) => {
      const formData = new FormData();
      formData.append('content', data.content);
      data.images.forEach(image => {
        formData.append('images', image);
      });
      
      const response = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket.id}/comments`] });
      setNewComment("");
      setSelectedImages([]);
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Comment submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async (data: { commentId: number; content: string }) => {
      return apiRequest(`/api/tickets/${ticket.id}/comments/${data.commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: data.content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket.id}/comments`] });
      setEditingCommentId(null);
      setEditContent("");
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest(`/api/tickets/${ticket.id}/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket.id}/comments`] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files].slice(0, 5));
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() && selectedImages.length === 0) return;
    
    createCommentMutation.mutate({
      content: newComment,
      images: selectedImages,
    });
  };

  const handleEditComment = (comment: TicketComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = () => {
    if (!editContent.trim() || !editingCommentId) return;
    
    updateCommentMutation.mutate({
      commentId: editingCommentId,
      content: editContent,
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const openImagePreview = (images: string[], startIndex: number) => {
    setImagePreviewImages(images);
    setImagePreviewIndex(startIndex);
    setImagePreviewUrl(images[startIndex]);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, imagePreviewIndex - 1)
      : Math.min(imagePreviewImages.length - 1, imagePreviewIndex + 1);
    
    setImagePreviewIndex(newIndex);
    setImagePreviewUrl(imagePreviewImages[newIndex]);
  };

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const getDisplayName = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return email;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Comments</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <Badge variant="outline">{comments.length}</Badge>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {comments.map((comment: TicketComment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(comment.user.firstName, comment.user.lastName, comment.user.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-900">
                      {getDisplayName(comment.user.firstName, comment.user.lastName, comment.user.email)}
                    </span>
                    {comment.isSystemGenerated && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {(comment.userId === userId || userRole === "root") && !comment.isSystemGenerated && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditComment(comment)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleUpdateComment}
                        disabled={updateCommentMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditContent("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                    
                    {comment.images && comment.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {comment.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Comment attachment ${index + 1}`}
                            className="h-16 w-16 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => openImagePreview(comment.images!, index)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to add one!</p>
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="border-t pt-4">
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px]"
          />
          
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative">
                  {file.type.startsWith('video/') ? (
                    <video
                      src={URL.createObjectURL(file)}
                      className="h-16 w-16 object-cover rounded"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Selected ${index + 1}`}
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0"
                    onClick={() => removeSelectedImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="comment-media"
              />
              <label htmlFor="comment-media">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Media
                  </span>
                </Button>
              </label>
              <span className="text-xs text-slate-500">
                {selectedImages.length}/5 files
              </span>
            </div>
            
            <Button
              onClick={handleSubmitComment}
              disabled={(!newComment.trim() && selectedImages.length === 0) || createCommentMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreviewUrl} onOpenChange={() => setImagePreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            )}
            {imagePreviewImages.length > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigateImage('prev')}
                  disabled={imagePreviewIndex === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  {imagePreviewIndex + 1} of {imagePreviewImages.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() => navigateImage('next')}
                  disabled={imagePreviewIndex === imagePreviewImages.length - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}