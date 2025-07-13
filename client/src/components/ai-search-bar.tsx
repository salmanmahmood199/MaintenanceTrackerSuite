import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Send, Loader2, Bot, User, Paperclip, Check, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MediaUpload } from "@/components/media-upload";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  action?: {
    type: string;
    data: any;
  };
  showMediaUpload?: boolean;
}

interface AISearchBarProps {
  className?: string;
}

export default function AISearchBar({ className }: AISearchBarProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [pendingTicketAction, setPendingTicketAction] = useState<any>(null);
  const [chatUploadedFiles, setChatUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const aiMutation = useMutation({
    mutationFn: async (userQuery: string) => {
      const hasImages = chatUploadedFiles.length > 0 || uploadedFiles.length > 0;
      // Send last 5 messages for context
      const conversationHistory = messages.slice(-5);
      const response = await apiRequest("POST", "/api/ai/query", { 
        query: userQuery,
        hasImages: hasImages,
        conversationHistory: conversationHistory
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now().toString() + "-ai",
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        action: data.action,
        showMediaUpload: data.action?.type === 'create_ticket'
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // If AI suggests creating a ticket, store the action for later
      if (data.action?.type === 'create_ticket') {
        setPendingTicketAction(data.action);
        // Only show media upload if no images are already available
        const hasImages = chatUploadedFiles.length > 0 || uploadedFiles.length > 0;
        if (!hasImages) {
          setShowMediaUpload(true);
        }
      }
    },
    onError: (error: any) => {
      console.error("AI query error:", error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: async ({ ticketData, files }: { ticketData: any; files: File[] }) => {
      const formData = new FormData();
      formData.append('title', ticketData.title);
      formData.append('description', ticketData.description);
      formData.append('priority', ticketData.priority);
      
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Ticket created successfully: ${data.ticketNumber}`,
      });
      
      // Clear state
      setUploadedFiles([]);
      setChatUploadedFiles([]);
      setShowMediaUpload(false);
      setPendingTicketAction(null);
      
      // Add success message
      const successMessage: Message = {
        id: Date.now().toString() + "-success",
        type: 'ai',
        content: `✅ Ticket created successfully! Ticket number: ${data.ticketNumber}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    }
  });

  const handleConfirmTicket = () => {
    if (pendingTicketAction) {
      // Use chatUploadedFiles if available, otherwise fall back to uploadedFiles
      const filesToUse = chatUploadedFiles.length > 0 ? chatUploadedFiles : uploadedFiles;
      
      if (filesToUse.length === 0) {
        toast({
          title: "Files Required",
          description: "Please upload at least one image or video before creating the ticket.",
          variant: "destructive",
        });
        return;
      }
      
      createTicketMutation.mutate({
        ticketData: pendingTicketAction.data,
        files: filesToUse
      });
    }
  };

  const handleCancelTicket = () => {
    setUploadedFiles([]);
    setChatUploadedFiles([]);
    setShowMediaUpload(false);
    setPendingTicketAction(null);
    
    const cancelMessage: Message = {
      id: Date.now().toString() + "-cancel",
      type: 'ai',
      content: "Ticket creation cancelled. How else can I help you?",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + "-user",
      type: 'user',
      content: query.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to AI
    aiMutation.mutate(query.trim());
    setQuery("");
    setIsExpanded(true);
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setMessages([]);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Ask AI to help with tickets, approvals, or status checks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            className="pl-10 pr-12 py-2 w-full bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={aiMutation.isPending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || aiMutation.isPending}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
          >
            {aiMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Expanded Chat Interface */}
      {isExpanded && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-w-2xl mx-auto shadow-lg border-gray-200 z-50 max-h-[80vh] flex flex-col">
          <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Messages */}
              <div className="space-y-3 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Hi! I can help you with:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Creating new tickets</li>
                      <li>• Checking ticket status</li>
                      <li>• Approving tickets</li>
                      <li>• Assigning work</li>
                      <li>• And more within your permissions</li>
                    </ul>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'ai' && (
                        <div className="flex-shrink-0">
                          <Bot className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.type === 'user' && (
                        <div className="flex-shrink-0">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {aiMutation.isPending && (
                  <div className="flex gap-3">
                    <Bot className="h-6 w-6 text-blue-600" />
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Media Upload and Confirmation Interface */}
              {showMediaUpload && pendingTicketAction && (
                <div className="mt-4 p-4 border-t border-gray-200 bg-blue-50 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-red-600" />
                      <h4 className="font-medium text-gray-900">Add Images or Videos (Required)</h4>
                      <span className="text-xs text-red-600 font-medium">*Required for all tickets</span>
                    </div>
                    
                    <MediaUpload 
                      onFilesChange={setUploadedFiles}
                      maxFiles={5}
                      acceptedTypes={['image/*', 'video/*']}
                    />
                    
                    {uploadedFiles.length === 0 && chatUploadedFiles.length === 0 && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        ⚠️ Please upload at least one image or video before creating the ticket
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleConfirmTicket}
                        disabled={createTicketMutation.isPending || (uploadedFiles.length === 0 && chatUploadedFiles.length === 0)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                      >
                        {createTicketMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {(uploadedFiles.length === 0 && chatUploadedFiles.length === 0) ? "Upload Files to Create Ticket" : "Create Ticket"}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelTicket}
                        variant="outline"
                        disabled={createTicketMutation.isPending}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Persistent Media Upload Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Upload Images/Videos</h4>
                  <span className="text-xs text-gray-500">(For creating tickets)</span>
                </div>
                
                <MediaUpload 
                  onFilesChange={setChatUploadedFiles}
                  maxFiles={5}
                  acceptedTypes={['image/*', 'video/*']}
                />
                
                {chatUploadedFiles.length > 0 && (
                  <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                    ✅ {chatUploadedFiles.length} file(s) ready for ticket creation
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("Show me my recent tickets");
                      handleSubmit(new Event('submit') as any);
                    }}
                    className="text-xs"
                  >
                    Recent Tickets
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("Create a new ticket");
                      handleSubmit(new Event('submit') as any);
                    }}
                    className="text-xs"
                  >
                    Create Ticket
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("What tickets need my attention?");
                      handleSubmit(new Event('submit') as any);
                    }}
                    className="text-xs"
                  >
                    Pending Actions
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}