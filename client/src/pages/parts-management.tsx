import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, TrendingUp, TrendingDown, History } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface Part {
  id: number;
  name: string;
  description?: string;
  currentCost: number;
  markupPercentage: number;
  roundToNinteyNine: boolean;
  vendorId: number;
  createdAt: string;
  updatedAt: string;
}

interface PartPriceHistory {
  id: number;
  partId: number;
  oldPrice: number;
  newPrice: number;
  markupPercentage: number;
  roundToNinteyNine: boolean;
  changedAt: string;
  changedBy: number;
}

export default function PartsManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [newPartName, setNewPartName] = useState("");
  const [newPartDescription, setNewPartDescription] = useState("");
  const [newPartCost, setNewPartCost] = useState("");
  const [newPartMarkup, setNewPartMarkup] = useState("20");
  const [roundToNinteyNine, setRoundToNinteyNine] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const vendorId = user?.maintenanceVendorId;

  // Fetch parts for the vendor
  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["/api/parts", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await apiRequest("GET", `/api/maintenance-vendors/${vendorId}/parts`);
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch price history for selected part
  const { data: priceHistory = [] } = useQuery({
    queryKey: ["/api/parts", selectedPart?.id, "history"],
    queryFn: async () => {
      if (!selectedPart?.id) return [];
      const response = await apiRequest("GET", `/api/parts/${selectedPart.id}/price-history`);
      return response.json();
    },
    enabled: !!selectedPart?.id && isHistoryModalOpen,
  });

  const addPartMutation = useMutation({
    mutationFn: async (partData: any) => {
      await apiRequest("POST", `/api/maintenance-vendors/${vendorId}/parts`, partData);
    },
    onSuccess: () => {
      toast({
        title: "Part Added",
        description: "New part has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parts", vendorId] });
      resetAddForm();
      setIsAddModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add part. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePartMutation = useMutation({
    mutationFn: async ({ partId, partData }: { partId: number; partData: any }) => {
      await apiRequest("PUT", `/api/parts/${partId}`, partData);
    },
    onSuccess: () => {
      toast({
        title: "Part Updated",
        description: "Part has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parts", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts", selectedPart?.id, "history"] });
      setIsEditModalOpen(false);
      setSelectedPart(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update part. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetAddForm = () => {
    setNewPartName("");
    setNewPartDescription("");
    setNewPartCost("");
    setNewPartMarkup("20");
    setRoundToNinteyNine(false);
  };

  const calculateSellingPrice = (cost: number, markup: number, roundUp: boolean) => {
    const markedUpPrice = cost * (1 + markup / 100);
    if (roundUp) {
      return Math.ceil(markedUpPrice) - 0.01; // Round to nearest .99
    }
    return markedUpPrice;
  };

  const handleAddPart = () => {
    if (!newPartName || !newPartCost) {
      toast({
        title: "Missing Information",
        description: "Please provide part name and cost.",
        variant: "destructive",
      });
      return;
    }

    const partData = {
      name: newPartName,
      description: newPartDescription || null,
      currentCost: parseFloat(newPartCost),
      markupPercentage: parseFloat(newPartMarkup),
      roundToNinteyNine,
    };

    addPartMutation.mutate(partData);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setNewPartName(part.name);
    setNewPartDescription(part.description || "");
    setNewPartCost(part.currentCost.toString());
    setNewPartMarkup(part.markupPercentage.toString());
    setRoundToNinteyNine(part.roundToNinteyNine);
    setIsEditModalOpen(true);
  };

  const handleUpdatePart = () => {
    if (!selectedPart || !newPartName || !newPartCost) {
      toast({
        title: "Missing Information",
        description: "Please provide part name and cost.",
        variant: "destructive",
      });
      return;
    }

    const partData = {
      name: newPartName,
      description: newPartDescription || null,
      currentCost: parseFloat(newPartCost),
      markupPercentage: parseFloat(newPartMarkup),
      roundToNinteyNine,
    };

    updatePartMutation.mutate({ partId: selectedPart.id, partData });
  };

  const showPriceHistory = (part: Part) => {
    setSelectedPart(part);
    setIsHistoryModalOpen(true);
  };

  if (!user || user.role !== "maintenance_admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Maintenance admin role required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parts Management</h1>
          <p className="text-muted-foreground">Manage your parts inventory and pricing</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Part
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Part</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="partName">Part Name *</Label>
                <Input
                  id="partName"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="Enter part name"
                />
              </div>
              
              <div>
                <Label htmlFor="partDescription">Description</Label>
                <Input
                  id="partDescription"
                  value={newPartDescription}
                  onChange={(e) => setNewPartDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <Label htmlFor="partCost">Cost *</Label>
                <Input
                  id="partCost"
                  type="number"
                  step="0.01"
                  value={newPartCost}
                  onChange={(e) => setNewPartCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="partMarkup">Markup Percentage</Label>
                <Input
                  id="partMarkup"
                  type="number"
                  step="1"
                  value={newPartMarkup}
                  onChange={(e) => setNewPartMarkup(e.target.value)}
                  placeholder="20"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="roundToNinteyNine"
                  checked={roundToNinteyNine}
                  onCheckedChange={(checked) => setRoundToNinteyNine(checked === true)}
                />
                <Label htmlFor="roundToNinteyNine">Round up to nearest .99</Label>
              </div>
              
              {newPartCost && newPartMarkup && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">Selling Price Preview:</p>
                  <p className="text-lg font-bold text-green-600">
                    ${calculateSellingPrice(
                      parseFloat(newPartCost) || 0,
                      parseFloat(newPartMarkup) || 0,
                      roundToNinteyNine
                    ).toFixed(2)}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAddPart}
                  disabled={addPartMutation.isPending}
                  className="flex-1"
                >
                  {addPartMutation.isPending ? "Adding..." : "Add Part"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetAddForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parts Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading parts...</p>
            </div>
          ) : parts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No parts found. Add your first part to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part: Part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>{part.description || "-"}</TableCell>
                    <TableCell>${part.currentCost.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{part.markupPercentage}%</Badge>
                      {part.roundToNinteyNine && (
                        <Badge variant="outline" className="ml-1">$.99</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      ${calculateSellingPrice(
                        part.currentCost,
                        part.markupPercentage,
                        part.roundToNinteyNine
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(part.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPart(part)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => showPriceHistory(part)}
                        >
                          <History className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Part Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editPartName">Part Name *</Label>
              <Input
                id="editPartName"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="Enter part name"
              />
            </div>
            
            <div>
              <Label htmlFor="editPartDescription">Description</Label>
              <Input
                id="editPartDescription"
                value={newPartDescription}
                onChange={(e) => setNewPartDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            
            <div>
              <Label htmlFor="editPartCost">Cost *</Label>
              <Input
                id="editPartCost"
                type="number"
                step="0.01"
                value={newPartCost}
                onChange={(e) => setNewPartCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="editPartMarkup">Markup Percentage</Label>
              <Input
                id="editPartMarkup"
                type="number"
                step="1"
                value={newPartMarkup}
                onChange={(e) => setNewPartMarkup(e.target.value)}
                placeholder="20"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editRoundToNinteyNine"
                checked={roundToNinteyNine}
                onCheckedChange={(checked) => setRoundToNinteyNine(checked === true)}
              />
              <Label htmlFor="editRoundToNinteyNine">Round up to nearest .99</Label>
            </div>
            
            {newPartCost && newPartMarkup && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">New Selling Price:</p>
                <p className="text-lg font-bold text-green-600">
                  ${calculateSellingPrice(
                    parseFloat(newPartCost) || 0,
                    parseFloat(newPartMarkup) || 0,
                    roundToNinteyNine
                  ).toFixed(2)}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpdatePart}
                disabled={updatePartMutation.isPending}
                className="flex-1"
              >
                {updatePartMutation.isPending ? "Updating..." : "Update Part"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedPart(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Price History - {selectedPart?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            {priceHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No price history available.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Old Price</TableHead>
                    <TableHead>New Price</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Markup</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((history: PartPriceHistory) => {
                    const change = history.newPrice - history.oldPrice;
                    const changePercent = ((change / history.oldPrice) * 100).toFixed(1);
                    
                    return (
                      <TableRow key={history.id}>
                        <TableCell>
                          {formatDistanceToNow(new Date(history.changedAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>${history.oldPrice.toFixed(2)}</TableCell>
                        <TableCell>${history.newPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {change > 0 ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : change < 0 ? (
                              <TrendingDown className="h-4 w-4 text-green-500" />
                            ) : null}
                            <span className={change > 0 ? "text-red-600" : change < 0 ? "text-green-600" : ""}>
                              {change > 0 ? "+" : ""}{change.toFixed(2)} ({changePercent}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{history.markupPercentage}%</Badge>
                          {history.roundToNinteyNine && (
                            <Badge variant="outline" className="ml-1">$.99</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}