import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Hash, User, Wrench, CheckCircle, ImageIcon, X, Plus, Trash2 } from "lucide-react";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";
import { getPriorityColor, getStatusColor } from "@/lib/utils";
import type { Ticket } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const workOrderSchema = z.object({
  workDescription: z.string().min(10, "Work description must be at least 10 characters"),
  completionStatus: z.enum(["completed", "return_needed"], {
    required_error: "Please select completion status"
  }),
  completionNotes: z.string().min(5, "Completion notes must be at least 5 characters"),
  parts: z.array(z.object({
    name: z.string().min(1, "Part name required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    cost: z.number().min(0, "Cost must be positive")
  })).optional(),
  otherCharges: z.array(z.object({
    description: z.string().min(1, "Description required"),
    cost: z.number().min(0, "Cost must be positive")
  })).optional(),
  // Time tracking fields
  timeIn: z.string().min(1, "Time in is required"),
  timeOut: z.string().min(1, "Time out is required"),
  // Manager signature fields
  managerName: z.string().min(2, "Manager name is required"),
  managerSignature: z.string().min(1, "Manager signature is required"),
});

type WorkOrderData = z.infer<typeof workOrderSchema>;

interface TechnicianWorkOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onSubmit?: (id: number, workOrder: WorkOrderData, images: File[]) => void;
  isLoading?: boolean;
}

export function TechnicianWorkOrderModal({
  open,
  onOpenChange,
  ticket,
  onSubmit,
  isLoading = false,
}: TechnicianWorkOrderModalProps) {
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [workImages, setWorkImages] = useState<File[]>([]);
  const [parts, setParts] = useState([{ name: "", quantity: 1, cost: 0 }]);
  const [otherCharges, setOtherCharges] = useState([{ description: "", cost: 0 }]);

  // Fetch available parts for this vendor
  const { data: availableParts = [], error: partsError } = useQuery({
    queryKey: [`/api/maintenance-vendors/${user?.maintenanceVendorId}/parts`],
    enabled: !!user?.maintenanceVendorId && open,
  });

  // Type the available parts properly
  const partsArray = Array.isArray(availableParts) ? availableParts : [];

  // Calculate selling price from cost and markup
  const calculateSellingPrice = (cost: number, markupPercentage: number, roundToNinteyNine: boolean) => {
    const markup = cost * (markupPercentage / 100);
    let sellingPrice = cost + markup;
    
    if (roundToNinteyNine) {
      // Round to nearest .99 (e.g., 12.34 becomes 12.99)
      sellingPrice = Math.floor(sellingPrice) + 0.99;
    }
    
    return sellingPrice;
  };



  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  // Calculate hours between time in and time out
  const calculateHours = (timeIn: string, timeOut: string) => {
    if (!timeIn || !timeOut) return 0;
    
    try {
      const [inHour, inMin] = timeIn.split(':').map(Number);
      const [outHour, outMin] = timeOut.split(':').map(Number);
      
      // Validate time format
      if (isNaN(inHour) || isNaN(inMin) || isNaN(outHour) || isNaN(outMin)) return 0;
      
      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;
      
      // Only calculate for same day (no next day support for now)
      if (outMinutes <= inMinutes) return 0;
      
      const totalMinutes = outMinutes - inMinutes;
      return Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      return 0;
    }
  };

  // Validate time out is after time in
  const validateTimeOrder = (timeIn: string, timeOut: string) => {
    if (!timeIn || !timeOut) return true; // Allow empty values
    
    try {
      const [inHour, inMin] = timeIn.split(':').map(Number);
      const [outHour, outMin] = timeOut.split(':').map(Number);
      
      // Validate time format
      if (isNaN(inHour) || isNaN(inMin) || isNaN(outHour) || isNaN(outMin)) return false;
      if (inHour < 0 || inHour > 23 || inMin < 0 || inMin > 59) return false;
      if (outHour < 0 || outHour > 23 || outMin < 0 || outMin > 59) return false;
      
      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;
      
      return outMinutes > inMinutes; // Must be same day and time out after time in
    } catch (error) {
      return false;
    }
  };

  // Signature canvas state and functions
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [open]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL();
        setSignatureData(dataURL);
        form.setValue("managerSignature", dataURL);
      }
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setIsDrawing(true);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData("");
        form.setValue("managerSignature", "");
      }
    }
  };

  const form = useForm<WorkOrderData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      workDescription: "",
      completionStatus: undefined,
      completionNotes: "",
      parts: [],
      otherCharges: [],
      timeIn: "",
      timeOut: "",
      managerName: "",
      managerSignature: "",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        workDescription: "",
        completionStatus: undefined,
        completionNotes: "",
        parts: [],
        otherCharges: [],
        timeIn: "",
        timeOut: "",
        managerName: "",
        managerSignature: "",
      });
      // Clear signature canvas
      clearSignature();
      setParts([{ name: "", quantity: 1, cost: 0 }]);
      setOtherCharges([{ description: "", cost: 0 }]);
      setWorkImages([]);
      setSelectedImageIndex(null);
    }
  }, [open, form]);

  if (!ticket) return null;

  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setWorkImages(prev => [...prev, ...files]);
  };

  const removeWorkImage = (index: number) => {
    setWorkImages(prev => prev.filter((_, i) => i !== index));
  };

  const addPart = () => {
    setParts(prev => [...prev, { name: "", quantity: 1, cost: 0 }]);
  };

  const removePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: string, value: any) => {
    setParts(prev => prev.map((part, i) => 
      i === index ? { ...part, [field]: value } : part
    ));
  };

  const selectPart = (index: number, partName: string) => {
    if (partName === "custom") {
      setParts(prev => prev.map((part, i) => 
        i === index ? { ...part, name: "custom", cost: 0 } : part
      ));
      return;
    }
    
    const selectedPart = partsArray.find((p: any) => p.name === partName);
    if (selectedPart) {
      const sellingPrice = calculateSellingPrice(
        Number(selectedPart.currentCost), 
        Number(selectedPart.markupPercentage),
        selectedPart.roundToNinteyNine
      );
      
      setParts(prev => prev.map((part, i) => 
        i === index ? { 
          ...part, 
          name: partName, 
          cost: sellingPrice 
        } : part
      ));
    }
  };

  const addOtherCharge = () => {
    setOtherCharges(prev => [...prev, { description: "", cost: 0 }]);
  };

  const removeOtherCharge = (index: number) => {
    setOtherCharges(prev => prev.filter((_, i) => i !== index));
  };

  const updateOtherCharge = (index: number, field: string, value: any) => {
    setOtherCharges(prev => prev.map((charge, i) => 
      i === index ? { ...charge, [field]: value } : charge
    ));
  };

  const handleSubmit = (data: WorkOrderData) => {
    const workOrder = {
      ...data,
      parts: parts.filter(p => p.name.trim() !== ""),
      otherCharges: otherCharges.filter(c => c.description.trim() !== ""),
    };
    onSubmit?.(ticket.id, workOrder, workImages);
    
    // Reset form after successful submission
    form.reset();
    setParts([{ name: "", quantity: 1, cost: 0 }]);
    setOtherCharges([{ description: "", cost: 0 }]);
    setWorkImages([]);
  };

  const showImageViewer = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
  };

  const totalPartsCost = parts.reduce((sum, part) => sum + (part.cost * part.quantity), 0);
  const totalOtherCost = 0; // Hidden from technicians
  const totalCost = totalPartsCost; // Only parts cost for technicians

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-foreground">
              <span>Work Order - {ticket.title}</span>
              <Badge variant="outline" className={`${priorityColor} border-current`}>
                {ticket.priority}
              </Badge>
              <Badge variant="outline" className={`${statusColor} border-current`}>
                {ticket.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Ticket Details */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Original Request</h4>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="text-foreground">{ticket.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      <span>{ticket.ticketNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Reporter: {ticket.reporterId}</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Created: {formatTz(toZonedTime(new Date(ticket.createdAt), 'America/New_York'), "MMM dd, yyyy 'at' h:mm a zzz", { timeZone: 'America/New_York' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Original Images */}
              {ticket.images && ticket.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Original Photos ({ticket.images.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ticket.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Original photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-border cursor-pointer hover:border-blue-400 transition-colors"
                          onClick={() => showImageViewer(index)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Work Order Form */}
            <div className="space-y-4">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="workDescription" className="text-foreground font-medium">Work Performed</Label>
                  <Textarea
                    id="workDescription"
                    placeholder="Describe the work performed, steps taken, findings..."
                    className="min-h-[100px] bg-background text-foreground border-border"
                    {...form.register("workDescription")}
                  />
                  {form.formState.errors.workDescription && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.workDescription.message}</p>
                  )}
                </div>

                {/* Work Photos */}
                <div>
                  <Label className="text-foreground font-medium">Work Photos</Label>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800 bg-background text-foreground border-border"
                    />
                    {workImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {workImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Work photo ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removeWorkImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parts Used */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground font-medium">Parts & Equipment Used</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addPart}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Part
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {parts.map((part, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Select
                            value={part.name && part.name !== "custom" ? part.name : ""}
                            onValueChange={(value) => selectPart(index, value)}
                          >
                            <SelectTrigger className="bg-background text-foreground border-border">
                              <SelectValue placeholder="Select a part" />
                            </SelectTrigger>
                            <SelectContent>
                              {partsArray.map((availablePart: any) => (
                                <SelectItem key={availablePart.id} value={availablePart.name}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{availablePart.name}</span>
                                    {availablePart.description && (
                                      <span className="text-xs text-muted-foreground">{availablePart.description}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">
                                <span className="italic text-muted-foreground">Custom part...</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {part.name === "custom" && (
                            <div className="mt-2">
                              <Label className="text-xs text-foreground">Custom Part Name</Label>
                              <Input
                                placeholder="Enter custom part name"
                                className="bg-background text-foreground border-border"
                                onChange={(e) => updatePart(index, "name", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-foreground">Quantity</Label>
                          <Input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={part.quantity}
                            className="bg-background text-foreground border-border"
                            onChange={(e) => updatePart(index, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-foreground">
                            {part.name === "custom" ? "Selling Price ($)" : "Selling Price (Auto-filled)"}
                          </Label>
                          <Input
                            type="number"
                            placeholder="Selling Price ($)"
                            min="0"
                            step="0.01"
                            value={part.cost}
                            disabled={part.name !== "custom"}
                            className={part.name !== "custom" ? "bg-muted text-muted-foreground" : "bg-background text-foreground border-border"}
                            onChange={(e) => updatePart(index, "cost", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removePart(index)}
                            disabled={parts.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {parts.length > 0 && (
                    <div className="text-sm text-foreground font-medium mt-2">
                      Parts Total (Selling Price): ${totalPartsCost.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Other Charges - Hidden from technicians */}

                {totalCost > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      Total Selling Price: ${totalCost.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Time Tracking Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-foreground mb-4">Time Tracking</h3>
                  
                  {/* Work Date - Auto-filled and grayed out */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-foreground font-medium">Work Date</Label>
                      <Input
                        type="date"
                        value={getCurrentDate()}
                        disabled
                        className="bg-muted text-foreground border-border"
                      />
                    </div>
                    
                    {/* Time In */}
                    <div>
                      <Label htmlFor="timeIn" className="text-foreground font-medium">Time In</Label>
                      <Input
                        id="timeIn"
                        type="time"
                        className="bg-background text-foreground border-border [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-150 dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-200"
                        {...form.register("timeIn", {
                          onChange: (e) => {
                            const timeOut = form.getValues("timeOut");
                            if (timeOut && timeOut !== "") {
                              // Clear any existing timeOut errors when timeIn changes
                              form.clearErrors("timeOut");
                            }
                          }
                        })}
                      />
                      {form.formState.errors.timeIn && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.timeIn.message}</p>
                      )}
                    </div>
                    
                    {/* Time Out */}
                    <div>
                      <Label htmlFor="timeOut" className="text-foreground font-medium">Time Out</Label>
                      <Input
                        id="timeOut"
                        type="time"
                        className="bg-background text-foreground border-border [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-150 dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-200"
                        {...form.register("timeOut", {
                          onChange: (e) => {
                            const timeIn = form.getValues("timeIn");
                            const timeOut = e.target.value;
                            
                            // Validate time order only if both fields have values
                            if (timeIn && timeOut && !validateTimeOrder(timeIn, timeOut)) {
                              form.setError("timeOut", {
                                type: "manual",
                                message: "Time Out must be after Time In (same day)"
                              });
                            } else if (timeOut) {
                              form.clearErrors("timeOut");
                            }
                          }
                        })}
                      />
                      {form.formState.errors.timeOut && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.timeOut.message}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Calculated Hours Display */}
                  {form.watch("timeIn") && form.watch("timeOut") && validateTimeOrder(form.watch("timeIn"), form.watch("timeOut")) && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mb-4">
                      <div className="font-medium text-green-900 dark:text-green-100">
                        Total Hours: {calculateHours(form.watch("timeIn"), form.watch("timeOut"))} hours
                      </div>
                    </div>
                  )}
                </div>

                {/* Manager Signature Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-foreground mb-4">Manager Verification</h3>
                  
                  {/* Manager Name */}
                  <div className="mb-4">
                    <Label htmlFor="managerName" className="text-foreground font-medium">Manager Name</Label>
                    <Input
                      placeholder="Enter manager's full name"
                      className="bg-background text-foreground border-border"
                      {...form.register("managerName")}
                    />
                    {form.formState.errors.managerName && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.managerName.message}</p>
                    )}
                  </div>
                  
                  {/* Manager Signature */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="managerSignature" className="text-foreground font-medium">Manager Signature</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSignature}
                        className="text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-lg bg-white dark:bg-gray-800">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={100}
                        className="w-full h-24 cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ touchAction: 'none' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click and drag to draw manager's signature for work verification
                    </p>
                    {form.formState.errors.managerSignature && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.managerSignature.message}</p>
                    )}
                  </div>
                </div>

                {/* Completion Status */}
                <div className="border-t pt-4">
                  <Label htmlFor="completionStatus" className="text-foreground font-medium">Job Status</Label>
                  <Select onValueChange={(value) => form.setValue("completionStatus", value as "completed" | "return_needed")}>
                    <SelectTrigger className="bg-background text-foreground border-border">
                      <SelectValue placeholder="Select job completion status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Job Completed</SelectItem>
                      <SelectItem value="return_needed">Will Need to Return</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.completionStatus && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.completionStatus.message}</p>
                  )}
                </div>

                {/* Completion Notes */}
                <div>
                  <Label htmlFor="completionNotes" className="text-foreground font-medium">
                    {form.watch("completionStatus") === "return_needed" ? "Return Details" : "Completion Notes"}
                  </Label>
                  <Textarea
                    id="completionNotes"
                    className="bg-background text-foreground border-border"
                    placeholder={
                      form.watch("completionStatus") === "return_needed" 
                        ? "Explain why return is needed (e.g., waiting for parts, need special equipment...)"
                        : "Final notes, customer instructions, or follow-up needed..."
                    }
                    {...form.register("completionNotes")}
                  />
                  {form.formState.errors.completionNotes && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.completionNotes.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isLoading ? "Submitting..." : "Complete Work Order"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && ticket.images && (
        <Dialog open={true} onOpenChange={closeImageViewer}>
          <DialogContent className="max-w-6xl max-h-[95vh] p-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                onClick={closeImageViewer}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={ticket.images[selectedImageIndex]}
                alt={`Original photo ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                {selectedImageIndex + 1} of {ticket.images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}