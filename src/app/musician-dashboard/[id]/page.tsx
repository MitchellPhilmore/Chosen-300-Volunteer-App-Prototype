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
  LogOut,
  ChevronRight,
  UserPlus,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  getMusicianById,
  getVolunteerByPhone,
  saveActiveMusicianSession,
  completeMusicianSession,
  getActiveMusicianSession,
  getCompletedMusicianSessions,
} from "@/lib/firebase";

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

// Interface for Musician Session (align with Firestore structure)
interface MusicianSession {
  id?: string; // Firestore document ID
  musicianId: string;
  musicianName: string;
  activity: string;
  signInTime: string; // ISO string
  signInTimeTimestamp?: any; // Firestore Timestamp for querying
  checkOutTime?: string; // ISO string
  checkOutTimeTimestamp?: any; // Firestore Timestamp for querying
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlsoVolunteer, setIsAlsoVolunteer] = useState(false);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Musician Data
        const musicianResult = await getMusicianById(id);
        if (!musicianResult.success || !musicianResult.data) {
          toast.error("Musician not found or error fetching data.");
          // Check localStorage for the ID set during sign-in to prevent unnecessary redirects
          const storedId = localStorage.getItem("currentMusicianId");
          if (storedId !== id) {
            router.push("/signin"); // Redirect if the ID doesn't match a valid session start
          } else {
            // Keep user on page but show error
            console.error(
              "Musician data mismatch or fetch error",
              musicianResult.error
            );
          }
          setLoading(false); // Ensure loading stops
          return;
        }
        const currentMusician = musicianResult.data as Musician;
        setMusician(currentMusician);

        // 2. Check if also Volunteer (using phone)
        if (currentMusician.phone) {
          const normalizedPhone = currentMusician.phone.replace(/\D/g, "");
          const volunteerResult = await getVolunteerByPhone(normalizedPhone);
          if (
            volunteerResult.success &&
            volunteerResult.data &&
            volunteerResult.data.length > 0
          ) {
            setIsAlsoVolunteer(true);
            // Assuming the first match is the relevant volunteer record
            setVolunteerId(volunteerResult.data[0].id);
          }
        }

        // 3. Fetch Active Session
        const activeSessionResult = await getActiveMusicianSession(id);
        if (activeSessionResult.success) {
          if (activeSessionResult.data) {
            const sessionData = activeSessionResult.data as MusicianSession;
            setActiveSession(sessionData);
            setIsSignedIn(true);
            setSelectedActivity(sessionData.activity);
            // Format timestamp if available, otherwise use ISO string
            setSignInTime(
              new Date(
                sessionData.signInTimeTimestamp?.toDate() ||
                  sessionData.signInTime
              ).toLocaleTimeString()
            );
          } else {
            // No active session
            setActiveSession(null);
            setIsSignedIn(false);
            setSignInTime(null);
            setSelectedActivity("");
          }
        } else {
          toast.error("Error fetching active session.");
          // Decide if this is critical - maybe allow dashboard access anyway?
        }

        // 4. Fetch Completed Sessions (History)
        const completedSessionsResult = await getCompletedMusicianSessions(id);
        if (completedSessionsResult.success && completedSessionsResult.data) {
          setMusicianHistory(completedSessionsResult.data as MusicianSession[]);
        } else {
          // If there's an error or no data (e.g., new musician), default to empty history
          setMusicianHistory([]);
          // Optionally log the error if it wasn't just 'no data'
          if (!completedSessionsResult.success) {
            console.error(
              "Error fetching session history:",
              completedSessionsResult.error
            );
            // You might still want a subtle notification or log here, but not a blocking error toast
            // toast.info("Could not fetch session history.");
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("An error occurred while loading dashboard data.");
        router.push("/signin"); // Redirect on critical error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSignIn = async () => {
    if (!selectedActivity) {
      toast.error("Please select an activity");
      return;
    }
    if (!musician) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const newSession: MusicianSession = {
        musicianId: id,
        musicianName: `${musician.firstName} ${musician.lastName}`,
        activity: selectedActivity,
        signInTime: now.toISOString(),
        // Timestamps will be added by Firestore function if needed
      };

      const result = await saveActiveMusicianSession(newSession);

      if (result.success && result.sessionId) {
        // Add the generated Firestore ID to the local state
        const savedSessionWithId = { ...newSession, id: result.sessionId };
        setActiveSession(savedSessionWithId);
        setSignInTime(now.toLocaleTimeString());
        setIsSignedIn(true);

        toast.success("Signed in successfully!", {
          description: `Activity: ${selectedActivity}`,
        });
      } else {
        toast.error("Failed to sign in. Please try again.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An error occurred during sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (!activeSession || !activeSession.id || !musician) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const updatedSessionData = {
        checkOutTime: now.toISOString(),
        // checkOutTimeTimestamp will be added by Firestore function
      };

      const result = await completeMusicianSession(
        activeSession.id,
        updatedSessionData
      );

      if (result.success) {
        // Update local state
        const completedSession = { ...activeSession, ...updatedSessionData };
        setActiveSession(null);
        setIsSignedIn(false);
        setSignInTime(null);
        // Add checkout timestamp locally if possible for immediate UI update
        completedSession.checkOutTimeTimestamp = { toDate: () => now };
        setMusicianHistory([completedSession, ...musicianHistory]);
        setSelectedActivity("");
        toast.success("Signed out successfully!");
        router.push("/"); // Redirect to the root page
      } else {
        toast.error("Failed to sign out. Please try again.");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("An error occurred during sign out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    // Attempt to find the session to use its timestamp object if available
    const session = musicianHistory.find(
      (s) => s.signInTime === dateString || s.checkOutTime === dateString
    );
    // Check for signInTime match
    if (session?.signInTimeTimestamp && session.signInTime === dateString) {
      try {
        return session.signInTimeTimestamp.toDate().toLocaleDateString();
      } catch (e) {
        /* Fall through */
      }
    }
    // Check for checkOutTime match
    if (session?.checkOutTimeTimestamp && session.checkOutTime === dateString) {
      try {
        return session.checkOutTimeTimestamp.toDate().toLocaleDateString();
      } catch (e) {
        /* Fall through */
      }
    }
    // Fallback to parsing ISO string
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };

  const totalSessions = useMemo(() => {
    return musicianHistory.length;
  }, [musicianHistory]);

  const totalTime = useMemo(() => {
    let totalMinutes = 0;
    musicianHistory.forEach((session) => {
      // Calculate duration using Timestamps if available for accuracy
      let startMillis: number | null = null;
      let endMillis: number | null = null;

      try {
        startMillis = session.signInTimeTimestamp?.toMillis();
      } catch {
        /* Ignore error if toMillis not available */
      }

      try {
        endMillis = session.checkOutTimeTimestamp?.toMillis();
      } catch {
        /* Ignore error */
      }

      if (startMillis && endMillis) {
        totalMinutes += Math.round((endMillis - startMillis) / 60000);
      } else if (session.signInTime && session.checkOutTime) {
        // Fallback to ISO strings (less accurate if timestamps aren't stored)
        try {
          const start = new Date(session.signInTime).getTime();
          const end = new Date(session.checkOutTime).getTime();
          if (!isNaN(start) && !isNaN(end)) {
            totalMinutes += Math.round((end - start) / 60000);
          }
        } catch (e) {
          console.warn("Could not parse session times:", session);
        }
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [musicianHistory]);

  const handleRegisterAsVolunteer = async (isCommunityService: boolean) => {
    if (!musician) return;

    setIsSubmitting(true);
    try {
      // Check Firebase directly if volunteer record exists with this phone
      const normalizedPhone = musician.phone.replace(/\D/g, "");
      const volunteerResult = await getVolunteerByPhone(normalizedPhone);

      if (
        volunteerResult.success &&
        volunteerResult.data &&
        volunteerResult.data.length > 0
      ) {
        const existingVolunteer = volunteerResult.data[0];
        setIsAlsoVolunteer(true);
        setVolunteerId(existingVolunteer.id);
        toast.info("You are already registered as a volunteer.");

        // Optionally redirect to volunteer registration if needed, passing data
        // router.push(`/register?type=${existingVolunteer.volunteerType || 'regular'}&source=musicianDashboard&volunteerId=${existingVolunteer.id}`);
      } else {
        // If not found in Firebase, proceed to registration page
        const type = isCommunityService ? "communityService" : "regular";
        const queryParams = new URLSearchParams({
          type,
          source: "musicianDashboard",
          firstName: musician.firstName,
          lastName: musician.lastName,
          email: musician.email || "",
          phone: musician.phone || "",
        }).toString();
        router.push(`/register?${queryParams}`);
      }
    } catch (error) {
      console.error("Error checking volunteer status:", error);
      toast.error("Could not check volunteer status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle explicit sign out (clears localStorage)
  const handleExplicitSignOut = () => {
    localStorage.removeItem("currentMusicianId");
    toast.info("You have been signed out.");
    router.push("/signin");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-red-700" />
      </div>
    );
  }

  if (!musician) {
    // This case should ideally be handled by the redirect in useEffect
    // But add a button to go back just in case.
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Card className="max-w-md mx-auto p-6">
          <CardTitle className="mb-4">Error</CardTitle>
          <CardContent>
            <p className="mb-4">
              Musician data could not be loaded or session is invalid.
            </p>
            <Button onClick={() => router.push("/signin")}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-4xl mx-auto border-none shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Removed back arrow to signin, sign out is explicit */}
                <div>
                  <CardTitle>Musician Dashboard</CardTitle>
                  <CardDescription>
                    Welcome, {musician.firstName} {musician.lastName}!
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExplicitSignOut} // Use explicit sign out handler
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Sign In/Out Card */}
        <Card className="max-w-4xl mx-auto border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isSignedIn ? (
              <div className="space-y-4">
                <Label htmlFor="activity">Select Activity</Label>
                <Select
                  value={selectedActivity}
                  onValueChange={setSelectedActivity}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="activity">
                    <SelectValue placeholder="Choose an activity..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rehearsal">Rehearsal</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <motion.div
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  <Button
                    onClick={handleSignIn}
                    disabled={!selectedActivity || isSubmitting}
                    className="w-full bg-red-700 hover:bg-red-800"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg font-medium text-green-600">
                  Currently signed in for: {selectedActivity}
                </p>
                <p className="text-sm text-gray-600">
                  Sign-in time: {signInTime}
                </p>
                <motion.div
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  <Button
                    onClick={handleSignOut}
                    disabled={isSubmitting}
                    variant="destructive"
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? "Signing Out..." : "Sign Out"}
                  </Button>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volunteer Registration Card (Conditional) */}
        {!isAlsoVolunteer && (
          <Card className="max-w-4xl mx-auto border-none shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Expand Your Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Interested in helping out beyond music? Register as a general
                volunteer or for community service hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className="flex-1"
                >
                  <Button
                    onClick={() => handleRegisterAsVolunteer(false)}
                    disabled={isSubmitting}
                    variant="outline"
                    className="w-full border-red-700 text-red-700 hover:bg-red-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Register as Volunteer
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className="flex-1"
                >
                  <Button
                    onClick={() => handleRegisterAsVolunteer(true)}
                    disabled={isSubmitting}
                    variant="outline"
                    className="w-full border-red-700 text-red-700 hover:bg-red-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className="mr-2 h-4 w-4" />
                    )}
                    Register for Community Service
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Card */}
        <Card className="max-w-4xl mx-auto border-none shadow-lg">
          <CardHeader>
            <CardTitle>Session History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around mb-6 text-center">
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {totalSessions || 0}
                </p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {totalTime || "0m"}
                </p>
                <p className="text-sm text-gray-600">Total Time</p>
              </div>
            </div>

            {musicianHistory.length > 0 ? (
              <ul className="space-y-4">
                {musicianHistory.map((session, index) => (
                  <motion.li
                    key={session.id || index} // Use Firestore ID if available
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border p-4 rounded-md shadow-sm bg-white"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                      <div className="mb-2 sm:mb-0">
                        <p className="font-medium text-red-700">
                          {session.activity}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.signInTime)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600 text-right">
                        <p>
                          In:{" "}
                          {new Date(session.signInTime).toLocaleTimeString()}
                        </p>
                        <p>
                          Out:{" "}
                          {session.checkOutTime
                            ? new Date(
                                session.checkOutTime
                              ).toLocaleTimeString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">
                No completed sessions found.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
