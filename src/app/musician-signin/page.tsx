"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, LogIn, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMusicianByPhone, getMusicianByEmail } from "@/lib/firebase";

export default function MusicianSignIn() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEmail = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginInput) {
      toast.error("Please enter your phone number or email");
      return;
    }

    setIsLoading(true);

    try {
      let musicianResult;

      // Check if input is email or phone
      if (isEmail(loginInput)) {
        // Search by email
        musicianResult = await getMusicianByEmail(loginInput);
      } else {
        // Normalize phone number (remove non-digits)
        const normalizedPhone = loginInput.replace(/\D/g, "");
        // Search by phone
        musicianResult = await getMusicianByPhone(normalizedPhone);
      }

      const musician =
        musicianResult.success &&
        musicianResult.data &&
        musicianResult.data.length > 0
          ? musicianResult.data[0]
          : null;

      if (!musician) {
        toast.error(
          `No musician found with this ${
            isEmail(loginInput) ? "email" : "phone number"
          }`
        );
        setIsLoading(false);
        return;
      }

      // Store current musician ID in localStorage for session management
      localStorage.setItem("currentMusicianId", musician.id);

      toast.success("Signed in successfully!");
      router.push(`/musician-dashboard/${musician.id}`);
    } catch (error) {
      console.error("Error during sign in:", error);
      toast.error("An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md mx-auto border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <CardTitle>Musician Sign In</CardTitle>
                <CardDescription>
                  Sign in with your phone number or email
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="loginInput">Phone Number or Email</Label>
                <Input
                  id="loginInput"
                  type="text"
                  placeholder="Enter your phone number or email"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <motion.div
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-red-700 hover:bg-red-800"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center space-x-3">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <LogIn className="h-6 w-6" />
                    )}
                    <span>{isLoading ? "Signing In..." : "Sign In"}</span>
                  </div>
                </Button>
              </motion.div>

              <div className="text-center text-sm text-gray-600">
                <p>Don't have an account?</p>
                <Link
                  href="/musician-register"
                  className="text-red-700 hover:underline"
                >
                  Register as a musician
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
