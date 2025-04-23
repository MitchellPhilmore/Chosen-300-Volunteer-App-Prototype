"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "@/lib/firebase";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User already logged in, redirecting...");
        router.replace("/admin");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful");
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No user found with this email.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid credentials provided.";
      }

      toast.error("Login failed", {
        description: errorMessage,
      });
      setPassword("");
    } finally {
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          setLoading(false);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="container w-full h-screen mx-auto flex items-center justify-center">
        Loading...
      </div>
    );
  }

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
                <Label htmlFor="email" className="text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  placeholder="admin@example.com"
                  className="h-12 text-base"
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-6">
              <Button
                type="submit"
                className="w-full h-12 text-base bg-red-700 hover:bg-red-800"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
