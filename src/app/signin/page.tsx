"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
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

export default function SignIn() {
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

    // Check if user is a musician
    const musicians = JSON.parse(localStorage.getItem("musicians") || "[]");
    const musician = musicians.find(
      (m: any) => m.phone.replace(/\D/g, "") === normalizedPhone
    );

    if (musician) {
      // Store current musician ID in localStorage for session management
      localStorage.setItem("currentMusicianId", musician.id);
      toast.success("Signed in successfully!");
      router.push(`/musician-dashboard/${musician.id}`);
      return;
    }

    // Check if user is a volunteer
    const volunteers = JSON.parse(localStorage.getItem("volunteers") || "[]");
    const volunteer = volunteers.find(
      (v: any) => v.phone.replace(/\D/g, "") === normalizedPhone
    );

    if (volunteer) {
      // Store current volunteer ID in localStorage for session management
      localStorage.setItem("currentVolunteerId", volunteer.id);
      toast.success("Signed in successfully!");
      router.push(`/volunteer-dashboard/${volunteer.id}`);
      return;
    }

    // If no match found
    toast.error("No account found with this phone number");
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
                <CardTitle>Sign In</CardTitle>
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
                <div className="flex justify-center space-x-4 mt-2">
                  <Link
                    href="/register"
                    className="text-red-700 hover:underline"
                  >
                    Register as Volunteer
                  </Link>
                  <span className="text-gray-400">|</span>
                  <Link
                    href="/musician-register"
                    className="text-red-700 hover:underline"
                  >
                    Register as Musician
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
