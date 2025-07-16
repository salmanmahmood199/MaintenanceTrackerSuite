import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { updateOrganizationSchema, type UpdateOrganization, type Organization } from "@shared/schema";
import { Key, Save } from "lucide-react";

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, data: UpdateOrganization) => void;
  onResetPassword: (id: number, newPassword: string) => void;
  isLoading: boolean;
  organization: Organization | null;
}

type OrganizationFormData = {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export function EditOrganizationModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onResetPassword,
  isLoading, 
  organization 
}: EditOrganizationModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(updateOrganizationSchema.pick({
      name: true,
      description: true,
      address: true,
      phone: true,
      email: true,
    })),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        description: organization.description || "",
        address: organization.address || "",
        phone: organization.phone || "",
        email: organization.email || "",
      });
    }
  }, [organization, form]);

  const handleSubmit = (data: OrganizationFormData) => {
    if (!organization) return;
    onSubmit(organization.id, data);
  };

  const handleResetPassword = () => {
    if (!organization || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    onResetPassword(organization.id, newPassword);
    setNewPassword("");
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter organization name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Enter address"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
            />
          </div>

          <div className="border-t pt-4">
            <Label>Reset Admin Password</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                type="password"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomPassword}
                size="sm"
              >
                Generate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPassword}
                disabled={!newPassword.trim()}
                size="sm"
              >
                <Key className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}