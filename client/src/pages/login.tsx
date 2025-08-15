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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <img
              src="/assets/taskscout-logo.png"
              alt="TaskScout Logo"
              className="w-20 h-20 object-contain"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              TaskScout
            </h1>
          </div>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-white">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="e.g test@gmail.com"
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-400 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="e.g test"
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-400 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 text-white"
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

              <div className="text-center">
                <a
                  href="/forgot-password"
                  className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Forgot your password?
                </a>
              </div>
            </form>


            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                New residential user?{" "}
                <a
                  href="/register/residential"
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
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
