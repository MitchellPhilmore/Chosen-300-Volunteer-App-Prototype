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
    <div className="container mx-auto flex  items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-xl border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Lock className="h-5 w-5" /> Admin Login
              </CardTitle>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              </Link>
            </div>
            <CardDescription>
              Enter your credentials to access the administrative dashboard.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="admin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800"
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
