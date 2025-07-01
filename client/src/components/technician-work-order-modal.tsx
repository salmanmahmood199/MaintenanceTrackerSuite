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
import { useState, useEffect } from "react";
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



  const form = useForm<WorkOrderData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      workDescription: "",
      completionStatus: undefined,
      completionNotes: "",
      parts: [],
      otherCharges: [],
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
      });
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
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
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
                <h4 className="font-medium text-slate-900 mb-2">Original Request</h4>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <p className="text-slate-700">{ticket.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      <span>{ticket.ticketNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Reporter: {ticket.reporterId}</span>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
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
                  <h4 className="font-medium text-slate-900 mb-3">Original Photos ({ticket.images.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ticket.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Original photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
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
                  <Label htmlFor="workDescription">Work Performed</Label>
                  <Textarea
                    id="workDescription"
                    placeholder="Describe the work performed, steps taken, findings..."
                    className="min-h-[100px]"
                    {...form.register("workDescription")}
                  />
                  {form.formState.errors.workDescription && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.workDescription.message}</p>
                  )}
                </div>

                {/* Work Photos */}
                <div>
                  <Label>Work Photos</Label>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                    <Label>Parts & Equipment Used</Label>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select a part" />
                            </SelectTrigger>
                            <SelectContent>
                              {partsArray.map((availablePart: any) => (
                                <SelectItem key={availablePart.id} value={availablePart.name}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{availablePart.name}</span>
                                    {availablePart.description && (
                                      <span className="text-xs text-gray-500">{availablePart.description}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">
                                <span className="italic text-gray-600">Custom part...</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {part.name === "custom" && (
                            <div className="mt-2">
                              <Label className="text-xs text-gray-600">Custom Part Name</Label>
                              <Input
                                placeholder="Enter custom part name"
                                onChange={(e) => updatePart(index, "name", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-600">Quantity</Label>
                          <Input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={part.quantity}
                            onChange={(e) => updatePart(index, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-gray-600">
                            {part.name === "custom" ? "Selling Price ($)" : "Selling Price (Auto-filled)"}
                          </Label>
                          <Input
                            type="number"
                            placeholder="Selling Price ($)"
                            min="0"
                            step="0.01"
                            value={part.cost}
                            disabled={part.name !== "custom"}
                            className={part.name !== "custom" ? "bg-gray-50" : ""}
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
                    <div className="text-sm text-slate-600 mt-2">
                      Parts Total (Selling Price): ${totalPartsCost.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Other Charges - Hidden from technicians */}

                {totalCost > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-blue-900">
                      Total Selling Price: ${totalCost.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Completion Status */}
                <div>
                  <Label htmlFor="completionStatus">Job Status</Label>
                  <Select onValueChange={(value) => form.setValue("completionStatus", value as "completed" | "return_needed")}>
                    <SelectTrigger>
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
                  <Label htmlFor="completionNotes">
                    {form.watch("completionStatus") === "return_needed" ? "Return Details" : "Completion Notes"}
                  </Label>
                  <Textarea
                    id="completionNotes"
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