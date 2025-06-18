import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@shared/schema";

const editTechnicianSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15, "Phone too long"),
});

type EditTechnicianFormData = z.infer<typeof editTechnicianSchema>;

interface EditTechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, data: EditTechnicianFormData) => void;
  onResetPassword: (id: number, newPassword: string) => void;
  isLoading: boolean;
  technician: User | null;
}

export function EditTechnicianModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onResetPassword,
  isLoading, 
  technician 
}: EditTechnicianModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const form = useForm<EditTechnicianFormData>({
    resolver: zodResolver(editTechnicianSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (technician && open) {
      form.reset({
        firstName: technician.firstName || "",
        lastName: technician.lastName || "",
        email: technician.email || "",
        phone: technician.phone || "",
      });
      setNewPassword("");
      setIsResettingPassword(false);
    }
  }, [technician, open, form]);

  const handleSubmit = (data: EditTechnicianFormData) => {
    if (technician) {
      onSubmit(technician.id, data);
    }
  };

  const handlePasswordReset = () => {
    if (technician && newPassword.trim()) {
      setIsResettingPassword(true);
      onResetPassword(technician.id, newPassword.trim());
      setNewPassword("");
      setIsResettingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Technician</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Enter first name"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Enter last name"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="Enter phone number (10 digits)"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Technician"}
            </Button>
          </div>
        </form>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h4 className="font-medium text-slate-900">Reset Password</h4>
          <div className="flex space-x-2">
            <Input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handlePasswordReset}
              disabled={!newPassword.trim() || isResettingPassword}
            >
              {isResettingPassword ? "Resetting..." : "Reset"}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            This will immediately change the technician's password
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}