import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bolt, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginData } from "@shared/schema";

interface LoginResponse {
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    organizationId: number | null;
    maintenanceVendorId: number | null;
  };
}

export default function Login() {
  const [error, setError] = useState<string>("");

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response as LoginResponse;
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      setError(error.message || "Login failed");
    },
  });

  const handleSubmit = (data: LoginData) => {
    setError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Bolt className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">MaintenanceHub</h1>
          </div>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="root@mail.com"
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="admin"
                  className="mt-1"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-blue-700"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Root Admin Login:</h3>
              <p className="text-xs text-slate-600">Email: root@mail.com</p>
              <p className="text-xs text-slate-600">Password: admin</p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-600">
                New residential user?{" "}
                <a href="/register/residential" className="text-blue-600 hover:underline">
                  Register here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}