"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, LogIn } from "lucide-react";
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

export default function MusicianSignIn() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    // Normalize phone number (remove non-digits)
    const normalizedPhone = phoneNumber.replace(/\D/g, "");

    // Get musicians from localStorage
    const musicians = JSON.parse(localStorage.getItem("musicians") || "[]");
    const musician = musicians.find(
      (m: any) => m.phone.replace(/\D/g, "") === normalizedPhone
    );

    if (!musician) {
      toast.error("No musician found with this phone number");
      return;
    }

    // Store current musician ID in localStorage for session management
    localStorage.setItem("currentMusicianId", musician.id);

    toast.success("Signed in successfully!");
    router.push(`/musician-dashboard/${musician.id}`);
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
                  Sign in with your phone number
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-red-700 hover:bg-red-800"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <LogIn className="h-6 w-6" />
                    <span>Sign In</span>
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
