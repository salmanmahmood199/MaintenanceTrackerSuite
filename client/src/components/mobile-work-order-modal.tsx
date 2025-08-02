import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wrench, Clock, DollarSign, Camera, CheckCircle, 
  X, Plus, Minus, Image, Video, ArrowLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Ticket } from '@shared/schema';

interface MobileWorkOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onSuccess: () => void;
}

interface WorkOrderItem {
  description: string;
  quantity: number;
  unitCost: number;
  type: 'parts' | 'labor';
}

export const MobileWorkOrderModal: React.FC<MobileWorkOrderModalProps> = ({
  open,
  onOpenChange,
  ticket,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<'details' | 'items' | 'photos' | 'review'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workOrderData, setWorkOrderData] = useState({
    workDescription: '',
    hoursWorked: '',
    technicianNotes: '',
    status: ticket?.status === 'accepted' ? 'in_progress' : 'completed'
  });
  const [workItems, setWorkItems] = useState<WorkOrderItem[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const { toast } = useToast();

  const handleNext = () => {
    switch (currentStep) {
      case 'details':
        setCurrentStep('items');
        break;
      case 'items':
        setCurrentStep('photos');
        break;
      case 'photos':
        setCurrentStep('review');
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'items':
        setCurrentStep('details');
        break;
      case 'photos':
        setCurrentStep('items');
        break;
      case 'review':
        setCurrentStep('photos');
        break;
      default:
        break;
    }
  };

  const addWorkItem = (type: 'parts' | 'labor') => {
    setWorkItems([...workItems, {
      description: '',
      quantity: 1,
      unitCost: 0,
      type
    }]);
  };

  const updateWorkItem = (index: number, field: keyof WorkOrderItem, value: any) => {
    const updated = [...workItems];
    updated[index] = { ...updated[index], [field]: value };
    setWorkItems(updated);
  };

  const removeWorkItem = (index: number) => {
    setWorkItems(workItems.filter((_, i) => i !== index));
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setPhotos([...photos, ...Array.from(files)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return workItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  };

  const handleSubmit = async () => {
    if (!ticket) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ticketId', ticket.id.toString());
      formData.append('workDescription', workOrderData.workDescription);
      formData.append('hoursWorked', workOrderData.hoursWorked);
      formData.append('technicianNotes', workOrderData.technicianNotes);
      formData.append('status', workOrderData.status);
      formData.append('workItems', JSON.stringify(workItems));

      photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });

      const response = await fetch('/api/work-orders', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Work order created successfully",
        });
        onSuccess();
        onOpenChange(false);
        // Reset form
        setCurrentStep('details');
        setWorkOrderData({
          workDescription: '',
          hoursWorked: '',
          technicianNotes: '',
          status: 'in_progress'
        });
        setWorkItems([]);
        setPhotos([]);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create work order",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create work order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full m-0 p-0 rounded-none">
        <div className="h-full flex flex-col">
          {/* Header with Progress */}
          <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <Wrench className="h-6 w-6 text-orange-600" />
                Work Order
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Ticket Info */}
            <div className="mb-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <h3 className="font-semibold text-lg mb-1">{ticket.title}</h3>
              <p className="text-muted-foreground">{ticket.ticketNumber}</p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-between items-center">
              {['details', 'items', 'photos', 'review'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step 
                      ? 'bg-orange-600 text-white' 
                      : index < ['details', 'items', 'photos', 'review'].indexOf(currentStep)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      index < ['details', 'items', 'photos', 'review'].indexOf(currentStep)
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Details</span>
              <span>Items</span>
              <span>Photos</span>
              <span>Review</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {currentStep === 'details' && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="workDescription" className="text-base font-medium mb-3 block">
                        Work Description *
                      </Label>
                      <Textarea
                        id="workDescription"
                        placeholder="Describe the work performed..."
                        value={workOrderData.workDescription}
                        onChange={(e) => setWorkOrderData({...workOrderData, workDescription: e.target.value})}
                        className="min-h-32 text-base resize-none"
                      />
                    </div>

                    <div>
                      <Label htmlFor="hoursWorked" className="text-base font-medium mb-3 block">
                        Hours Worked
                      </Label>
                      <Input
                        id="hoursWorked"
                        type="number"
                        step="0.5"
                        placeholder="0.0"
                        value={workOrderData.hoursWorked}
                        onChange={(e) => setWorkOrderData({...workOrderData, hoursWorked: e.target.value})}
                        className="text-base h-14"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status" className="text-base font-medium mb-3 block">
                        Work Status
                      </Label>
                      <Select 
                        value={workOrderData.status} 
                        onValueChange={(value) => setWorkOrderData({...workOrderData, status: value})}
                      >
                        <SelectTrigger className="h-14 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">Work in Progress</SelectItem>
                          <SelectItem value="completed">Work Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="technicianNotes" className="text-base font-medium mb-3 block">
                        Technician Notes
                      </Label>
                      <Textarea
                        id="technicianNotes"
                        placeholder="Additional notes or observations..."
                        value={workOrderData.technicianNotes}
                        onChange={(e) => setWorkOrderData({...workOrderData, technicianNotes: e.target.value})}
                        className="min-h-24 text-base resize-none"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 'items' && (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <Button
                        onClick={() => addWorkItem('parts')}
                        className="flex-1 h-16 text-base"
                        variant="outline"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Parts
                      </Button>
                      <Button
                        onClick={() => addWorkItem('labor')}
                        className="flex-1 h-16 text-base"
                        variant="outline"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Labor
                      </Button>
                    </div>

                    {workItems.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <Badge variant={item.type === 'parts' ? 'default' : 'secondary'}>
                            {item.type === 'parts' ? 'Parts' : 'Labor'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeWorkItem(index)}
                            className="h-8 w-8 text-red-500"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Description</Label>
                            <Input
                              placeholder={item.type === 'parts' ? 'Part description...' : 'Labor description...'}
                              value={item.description}
                              onChange={(e) => updateWorkItem(index, 'description', e.target.value)}
                              className="text-base h-12"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateWorkItem(index, 'quantity', parseInt(e.target.value))}
                                className="text-base h-12"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Unit Cost ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitCost}
                                onChange={(e) => updateWorkItem(index, 'unitCost', parseFloat(e.target.value))}
                                className="text-base h-12"
                              />
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-semibold">
                              Total: ${(item.quantity * item.unitCost).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {workItems.length > 0 && (
                      <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                        <div className="text-center">
                          <span className="text-xl font-bold text-green-700 dark:text-green-300">
                            Grand Total: ${calculateTotal().toFixed(2)}
                          </span>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {currentStep === 'photos' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <label className="block">
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handlePhotoCapture}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          size="lg"
                          className="h-20 px-8 text-base"
                          asChild
                        >
                          <span>
                            <Camera className="h-6 w-6 mr-3" />
                            Add Photos/Videos
                          </span>
                        </Button>
                      </label>
                      <p className="text-sm text-muted-foreground mt-2">
                        Take photos of completed work, before/after shots, or any relevant documentation
                      </p>
                    </div>

                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                              {photo.type.startsWith('video/') ? (
                                <Video className="h-12 w-12 text-gray-400" />
                              ) : (
                                <Image className="h-12 w-12 text-gray-400" />
                              )}
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs text-white bg-black/50 p-1 rounded truncate">
                                {photo.name}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={() => removePhoto(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <Card className="p-6">
                      <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-lg">Work Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 space-y-4">
                        <div>
                          <Label className="font-medium">Work Description</Label>
                          <p className="text-muted-foreground mt-1">{workOrderData.workDescription || 'No description provided'}</p>
                        </div>
                        
                        {workOrderData.hoursWorked && (
                          <div>
                            <Label className="font-medium">Hours Worked</Label>
                            <p className="text-muted-foreground mt-1">{workOrderData.hoursWorked} hours</p>
                          </div>
                        )}

                        <div>
                          <Label className="font-medium">Status</Label>
                          <Badge className="ml-2">
                            {workOrderData.status === 'in_progress' ? 'In Progress' : 'Completed'}
                          </Badge>
                        </div>

                        {workItems.length > 0 && (
                          <div>
                            <Label className="font-medium">Work Items ({workItems.length})</Label>
                            <div className="mt-2 space-y-2">
                              {workItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                  <span className="text-sm">{item.description}</span>
                                  <span className="font-medium">${(item.quantity * item.unitCost).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/20 rounded font-semibold">
                                <span>Total Cost</span>
                                <span>${calculateTotal().toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {photos.length > 0 && (
                          <div>
                            <Label className="font-medium">Photos/Videos ({photos.length})</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {photos.length} files attached
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t bg-gray-50 dark:bg-gray-900/50">
            <div className="flex justify-between gap-4">
              {currentStep !== 'details' && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  className="h-14 px-8 text-base flex-1"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
              )}
              
              {currentStep !== 'review' ? (
                <Button
                  size="lg"
                  onClick={handleNext}
                  disabled={currentStep === 'details' && !workOrderData.workDescription.trim()}
                  className="h-14 px-8 text-base flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !workOrderData.workDescription.trim()}
                  className="h-14 px-8 text-base flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Create Work Order
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};