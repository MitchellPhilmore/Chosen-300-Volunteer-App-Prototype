"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem("isAdminLoggedIn") === "true") {
      router.replace("/admin");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "password") {
      localStorage.setItem("isAdminLoggedIn", "true");
      toast.success("Login successful");
      router.push("/admin"); // Redirect to admin dashboard on success
    } else {
      toast.error("Login failed", {
        description: "Invalid username or password",
      });
      setPassword(""); // Clear password field on failure
    }
  };

  return (
    <div className="container w-full h-full mx-auto flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="w-full shadow-xl border-gray-200">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <Lock className="h-6 w-6" /> Admin Login
              </CardTitle>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              </Link>
            </div>
            <CardDescription className="text-base">
              Enter your credentials to access the administrative dashboard.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-base">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="admin"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-base">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="h-12 text-base"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-6">
              <Button
                type="submit"
                className="w-full h-12 text-base bg-red-700 hover:bg-red-800"
              >
                Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
