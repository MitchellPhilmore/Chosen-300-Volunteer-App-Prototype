"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Music,
  Clock,
  Calendar,
  CheckCircle2,
  History,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LogOut } from "lucide-react";

// Interface for Musician (align with registration/admin)
interface Musician {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  instruments: string[];
  experience?: string;
  availability?: string;
  registrationDate: string;
}

// Interface for Musician Session (align with admin)
interface MusicianSession {
  musicianId: string;
  activity: string;
  signInTime: string;
  checkOutTime?: string;
}

export default function MusicianDashboard({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const id = params.id;
  const [musician, setMusician] = useState<Musician | null>(null);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [signInTime, setSignInTime] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<MusicianSession | null>(
    null
  );
  const [musicianHistory, setMusicianHistory] = useState<MusicianSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const musicians = JSON.parse(localStorage.getItem("musicians") || "[]");
    const foundMusician = musicians.find((m: Musician) => m.id === id);

    if (!foundMusician) {
      toast.error("Musician not found");
      router.push("/");
      return;
    }

    setMusician(foundMusician);

    // Load session data
    const allSignIns: MusicianSession[] = JSON.parse(
      localStorage.getItem("musicianSignIns") || "[]"
    );
    const musicianSignIns = allSignIns.filter((s) => s.musicianId === id);

    // Find active session (no checkout time)
    const currentActiveSession = musicianSignIns.find((s) => !s.checkOutTime);
    if (currentActiveSession) {
      setActiveSession(currentActiveSession);
      setIsSignedIn(true);
      setSelectedActivity(currentActiveSession.activity);
      setSignInTime(
        new Date(currentActiveSession.signInTime).toLocaleTimeString()
      );
    } else {
      setActiveSession(null);
      setIsSignedIn(false);
      setSignInTime(null);
      setSelectedActivity("");
    }

    // Find completed sessions (have checkout time)
    const completedSessions = musicianSignIns.filter((s) => !!s.checkOutTime);
    setMusicianHistory(completedSessions);

    setLoading(false);
  }, [id, router]);

  const handleSignIn = () => {
    if (!selectedActivity) {
      toast.error("Please select an activity");
      return;
    }
    if (!musician) return;

    const now = new Date();
    const newSession: MusicianSession = {
      musicianId: id,
      activity: selectedActivity,
      signInTime: now.toISOString(),
    };

    // Update localStorage
    const allSignIns = JSON.parse(
      localStorage.getItem("musicianSignIns") || "[]"
    );
    allSignIns.push(newSession);
    localStorage.setItem("musicianSignIns", JSON.stringify(allSignIns));

    // Update state
    setActiveSession(newSession);
    setSignInTime(now.toLocaleTimeString());
    setIsSignedIn(true);

    toast.success("Signed in successfully!", {
      description: `Activity: ${selectedActivity}`,
    });
  };

  const handleSignOut = () => {
    if (!activeSession || !musician) return;

    const now = new Date();
    const updatedSession = {
      ...activeSession,
      checkOutTime: now.toISOString(),
    };

    // Update localStorage
    const allSignIns: MusicianSession[] = JSON.parse(
      localStorage.getItem("musicianSignIns") || "[]"
    );
    const updatedSignIns = allSignIns.map((s) =>
      s.musicianId === activeSession.musicianId &&
      s.signInTime === activeSession.signInTime
        ? updatedSession
        : s
    );
    localStorage.setItem("musicianSignIns", JSON.stringify(updatedSignIns));

    // Update state
    setActiveSession(null);
    setIsSignedIn(false);
    setSignInTime(null);
    setMusicianHistory([updatedSession, ...musicianHistory]);
    setSelectedActivity("");

    toast.success("Signed out successfully!");
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const totalSessions = useMemo(() => {
    return musicianHistory.length;
  }, [musicianHistory]);

  const totalTime = useMemo(() => {
    let totalMinutes = 0;
    musicianHistory.forEach((session) => {
      if (session.checkOutTime) {
        const start = new Date(session.signInTime).getTime();
        const end = new Date(session.checkOutTime).getTime();
        const durationMinutes = Math.round((end - start) / 60000);
        totalMinutes += durationMinutes;
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [musicianHistory]);

  if (loading || !musician) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Musician Dashboard</h1>
            <CardDescription>
              Welcome, {musician.firstName} {musician.lastName}
            </CardDescription>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              className="border-red-700 text-red-700 hover:bg-red-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <Clock className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTime}</div>
              <p className="text-xs text-muted-foreground">
                Total duration contributed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Musician Since
              </CardTitle>
              <Calendar className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDate(musician.registrationDate)}
              </div>
              <p className="text-xs text-muted-foreground">Registration date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <History className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Completed sessions
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Your Status & Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Instruments
                  </p>
                  <p className="text-md font-semibold">
                    {musician.instruments.join(", ") || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-md font-semibold">
                    {musician.email || musician.phone || "N/A"}
                  </p>
                </div>
              </div>

              {!isSignedIn ? (
                <div className="space-y-4 p-4 border rounded-md">
                  <Label htmlFor="activity-select" className="font-medium">
                    Sign In for an Activity
                  </Label>
                  <Select
                    value={selectedActivity}
                    onValueChange={setSelectedActivity}
                  >
                    <SelectTrigger id="activity-select">
                      <SelectValue placeholder="Select activity..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rehearsal">Rehearsal</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="recording">Recording</SelectItem>
                      <SelectItem value="teaching">Teaching</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      onClick={handleSignIn}
                      className="w-full bg-red-700 hover:bg-red-800"
                      disabled={!selectedActivity}
                    >
                      <Music className="mr-2 h-5 w-5" />
                      Sign In
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">
                          Currently Signed In
                        </p>
                        <p className="text-sm text-green-700">
                          Activity:{" "}
                          <span className="font-medium">
                            {selectedActivity}
                          </span>
                        </p>
                        <p className="text-sm text-green-700">
                          Time:{" "}
                          <span className="font-medium">{signInTime}</span>
                        </p>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-1 h-4 w-4" /> Sign Out
                      </Button>
                    </motion.div>
                  </div>
                </div>
              )}

              {musicianHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-3">
                    Session History
                  </h3>
                  <ul>
                    {musicianHistory.slice(0, 5).map((session, index) => (
                      <li key={index} className="text-sm text-gray-600 mb-1">
                        {formatDate(session.signInTime)} - {session.activity}
                      </li>
                    ))}
                  </ul>
                  {musicianHistory.length > 5 && (
                    <p className="text-sm text-red-700 mt-2">
                      View full history...
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
