"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, Clock, Calendar, CheckCircle2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MusicianDashboard({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [musician, setMusician] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [signInTime, setSignInTime] = useState<string | null>(null);

  useEffect(() => {
    const musicians = JSON.parse(localStorage.getItem("musicians") || "[]");
    const foundMusician = musicians.find((m: any) => m.id === params.id);

    if (!foundMusician) {
      toast.error("Musician not found");
      router.push("/");
      return;
    }

    setMusician(foundMusician);
  }, [params.id, router]);

  const handleSignIn = () => {
    if (!selectedActivity) {
      toast.error("Please select an activity");
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setSignInTime(timeString);
    setIsSignedIn(true);

    // Store the sign-in record
    const signIns = JSON.parse(localStorage.getItem("musicianSignIns") || "[]");
    signIns.push({
      musicianId: params.id,
      activity: selectedActivity,
      signInTime: now.toISOString(),
    });
    localStorage.setItem("musicianSignIns", JSON.stringify(signIns));

    toast.success("Signed in successfully!", {
      description: `Activity: ${selectedActivity}`,
    });
  };

  if (!musician) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-2xl mx-auto border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <CardTitle>Musician Dashboard</CardTitle>
                <CardDescription>
                  Welcome, {musician.firstName} {musician.lastName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Instrument</p>
                  <p className="text-lg">{musician.instrument}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Contact</p>
                  <p className="text-lg">{musician.email || musician.phone}</p>
                </div>
              </div>

              {!isSignedIn ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Select Activity</p>
                    <Select
                      value={selectedActivity}
                      onValueChange={setSelectedActivity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="What will you be doing?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rehearsal">Rehearsal</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="recording">Recording</SelectItem>
                        <SelectItem value="teaching">Teaching</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleSignIn}
                      className="w-full bg-red-700 hover:bg-red-800"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <Music className="h-6 w-6" />
                        <span>Sign In</span>
                        <CheckCircle2 className="h-5 w-5 opacity-70" />
                      </div>
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium">Currently Signed In</p>
                      <p className="text-sm text-gray-600">
                        Activity: {selectedActivity}
                      </p>
                      <p className="text-sm text-gray-600">
                        Time: {signInTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
