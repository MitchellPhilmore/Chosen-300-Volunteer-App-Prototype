"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LogIn,
  UserPlus,
  Music,
  Heart,
  Loader2,
} from "lucide-react";
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
import {
  getVolunteerByPhone,
  getMusicianByPhone,
  getVolunteerByEmail,
  getMusicianByEmail,
} from "@/lib/firebase";

export default function SignIn() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [musician, setMusician] = useState<any>(null);
  const [volunteer, setVolunteer] = useState<any>(null);
  const [communityService, setCommunityService] = useState<any>(null);

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
      let volunteerResult;

      // Check if input is email or phone
      if (isEmail(loginInput)) {
        // Search by email
        musicianResult = await getMusicianByEmail(loginInput);
        volunteerResult = await getVolunteerByEmail(loginInput);
      } else {
        // Search by phone
        // Normalize phone number (remove non-digits)
        const normalizedPhone = loginInput.replace(/\D/g, "");

        musicianResult = await getMusicianByPhone(normalizedPhone);
        volunteerResult = await getVolunteerByPhone(normalizedPhone);
      }

      const musicianMatch =
        musicianResult.success &&
        musicianResult.data &&
        musicianResult.data.length > 0
          ? musicianResult.data[0]
          : null;

      const allVolunteers =
        volunteerResult.success && volunteerResult.data
          ? volunteerResult.data
          : [];

      // For regular volunteers and community service volunteers
      const volunteerMatch = allVolunteers.find(
        (v: any) => !v.volunteerType || v.volunteerType !== "communityService"
      );

      const communityServiceMatch = allVolunteers.find(
        (v: any) => v.volunteerType === "communityService"
      );

      // Set state variables for potential role selection screen
      if (musicianMatch) setMusician(musicianMatch);
      if (volunteerMatch) setVolunteer(volunteerMatch);
      if (communityServiceMatch) setCommunityService(communityServiceMatch);

      // Check if we found any matching accounts using the direct match variables, not state
      if (musicianMatch || volunteerMatch || communityServiceMatch) {
        // Handle multiple roles - Check direct matches, not state
        if (
          (musicianMatch && volunteerMatch) ||
          (musicianMatch && communityServiceMatch) ||
          (volunteerMatch && communityServiceMatch)
        ) {
          setShowRoleSelection(true);
          return;
        }

        // Handle single role - use direct matches for immediate navigation
        if (musicianMatch) {
          const id = musicianMatch.id;
          // Store current musician ID in localStorage for session management
          localStorage.setItem("currentMusicianId", id);
          toast.success("Signed in successfully as a musician!");
          router.push(`/musician-dashboard/${id}`);
          return;
        }

        if (volunteerMatch) {
          const id = volunteerMatch.id;
          // Store current volunteer ID in localStorage for session management
          localStorage.setItem("currentVolunteerId", id);
          toast.success("Signed in successfully as a volunteer!");
          router.push(`/volunteer-dashboard/${id}`);
          return;
        }

        if (communityServiceMatch) {
          const id = communityServiceMatch.id;
          // Store current community service ID in localStorage for session management
          localStorage.setItem("currentVolunteerId", id); // Using volunteer ID key for now
          toast.success("Signed in successfully for community service!");
          router.push(`/volunteer-dashboard/${id}`);
          return;
        }
      } else {
        // If no match found
        toast.error(
          `No account found with this ${
            isEmail(loginInput) ? "email" : "phone number"
          }`
        );
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      toast.error("An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = (
    role: "musician" | "volunteer" | "communityService"
  ) => {
    if (role === "musician" && musician) {
      localStorage.setItem("currentMusicianId", musician.id);
      toast.success("Signed in successfully as a musician!");
      router.push(`/musician-dashboard/${musician.id}`);
    } else if (role === "volunteer" && volunteer) {
      localStorage.setItem("currentVolunteerId", volunteer.id);
      toast.success("Signed in successfully as a volunteer!");
      router.push(`/volunteer-dashboard/${volunteer.id}`);
    } else if (role === "communityService" && communityService) {
      localStorage.setItem("currentVolunteerId", communityService.id);
      toast.success("Signed in successfully for community service!");
      router.push(`/volunteer-dashboard/${communityService.id}`);
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
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!showRoleSelection ? (
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
                  <div className="flex justify-center space-x-4 mt-2">
                    <Link
                      href="/register"
                      className="text-red-700 hover:underline"
                    >
                      Register as Volunteer
                    </Link>
                    <Link
                      href="/register?type=communityService"
                      className="text-red-700 hover:underline"
                    >
                      Register for Community Service
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
            ) : (
              <div className="space-y-8">
                <p className="text-center text-lg">
                  You're registered as multiple roles. Please select how you
                  would like to sign in:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {musician && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full"
                    >
                      <Button
                        onClick={() => handleRoleSelection("musician")}
                        className="w-full bg-red-700 hover:bg-red-800 h-36 flex flex-col items-center justify-center text-lg px-2"
                      >
                        <Music className="h-12 w-12 mb-3" />
                        <span className="text-center">Musician</span>
                      </Button>
                    </motion.div>
                  )}

                  {volunteer && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full"
                    >
                      <Button
                        onClick={() => handleRoleSelection("volunteer")}
                        className="w-full bg-red-700 hover:bg-red-800 h-36 flex flex-col items-center justify-center text-lg px-2"
                      >
                        <UserPlus className="h-12 w-12 mb-3" />
                        <span className="text-center">Volunteer</span>
                      </Button>
                    </motion.div>
                  )}

                  {communityService && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:col-span-2 lg:col-span-1"
                    >
                      <Button
                        onClick={() => handleRoleSelection("communityService")}
                        className="w-full bg-red-700 hover:bg-red-800 h-36 flex flex-col items-center justify-center text-lg px-4 whitespace-normal"
                      >
                        <Heart className="h-12 w-12 mb-3" />
                        <span className="text-center">Community Service</span>
                      </Button>
                    </motion.div>
                  )}
                </div>

                <div className="text-center pt-4">
                  <Button
                    variant="link"
                    onClick={() => setShowRoleSelection(false)}
                    className="text-red-700 text-lg"
                  >
                    Back to sign in
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
