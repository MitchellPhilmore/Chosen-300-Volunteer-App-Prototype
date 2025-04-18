"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Calendar,
  Award,
  History,
  LogOut,
  Loader2,
  Star,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  volunteerType?: "regular" | "communityService";
  serviceReason?: string;
  serviceInstitution?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  registrationDate: string;
}

interface VolunteerSession {
  identifier: string;
  program: string;
  checkInTime: string;
  checkOutTime?: string | undefined;
  hoursWorked?: string;
  location: string;
  volunteerInfo: {
    id: string;
    firstName: string;
    lastName: string;
  };
  adminCode: string;
  rating?: number;
  comments?: string;
  isCommunityServiceSession?: boolean;
}

export default function VolunteerDashboard() {
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminCode, setAdminCode] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isCsSession, setIsCsSession] = useState(false);
  const [csReason, setCsReason] = useState("");
  const [csInstitution, setCsInstitution] = useState("");
  const [volunteerHistory, setVolunteerHistory] = useState<VolunteerSession[]>(
    []
  );
  const [activeSession, setActiveSession] = useState<VolunteerSession | null>(
    null
  );
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState({
    highlights: "",
    feedback: "",
    issues: "",
    hadFun: false,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Fetch volunteer data
    const volunteers = JSON.parse(localStorage.getItem("volunteers") || "[]");
    const foundVolunteer = volunteers.find((v: Volunteer) => v.id === id);

    if (foundVolunteer) {
      setVolunteer(foundVolunteer);

      // Check if volunteer has an active session
      const activeVolunteers = JSON.parse(
        localStorage.getItem("activeVolunteers") || "[]"
      );
      const currentSession = activeVolunteers.find(
        (s: VolunteerSession) => s.volunteerInfo && s.volunteerInfo.id === id
      );

      if (currentSession) {
        setActiveSession(currentSession);
      }

      // Get volunteer history
      const completedSessions = JSON.parse(
        localStorage.getItem("completedSessions") || "[]"
      );
      const history = completedSessions.filter(
        (s: VolunteerSession) => s.volunteerInfo && s.volunteerInfo.id === id
      );

      setVolunteerHistory(history);
    } else {
      // Volunteer not found, redirect to home
      toast.error("Volunteer not found");
      router.push("/");
    }

    setLoading(false);
  }, [id, router]);

  const handleCheckIn = () => {
    if (!volunteer) return;
    if (!adminCode) {
      toast.error("Please enter the admin code");
      return;
    }

    if (!selectedProgram) {
      toast.error("Please select a program");
      return;
    }

    if (!selectedLocation) {
      toast.error("Please select a location");
      return;
    }

    // New Validation: If checking in for CS for the first time, require reason and institution
    if (isCsSession && volunteer.volunteerType !== "communityService") {
      if (!csReason) {
        toast.error("Please enter the reason for your community service");
        return;
      }
      if (!csInstitution) {
        toast.error("Please enter the institution requiring your service");
        return;
      }
    }

    // Validate admin code
    const savedCode = localStorage.getItem("dailyCode");
    if (!savedCode) {
      toast.error("No active check-in code", {
        description: "Please check with your coordinator.",
      });
      setAdminCode(""); // Clear the input
      return;
    }

    const activeCode = JSON.parse(savedCode);

    // Check if code has expired
    if (new Date(activeCode.expiresAt) <= new Date()) {
      toast.error("Check-in code has expired", {
        description: "Please check with your coordinator for today's code.",
      });
      setAdminCode(""); // Clear the input
      return;
    }

    // Ensure both codes are padded to 4 digits for comparison
    const submittedCode = adminCode.padStart(4, "0");
    const storedCode = activeCode.code.padStart(4, "0");

    if (submittedCode !== storedCode) {
      toast.error("Invalid check-in code", {
        description: "Please check with your coordinator for the correct code.",
      });
      setAdminCode(""); // Clear the input
      return;
    }

    setIsCheckingIn(true);

    // Potentially update the main volunteer record first if upgrading to CS
    let updatedVolunteerData = { ...volunteer }; // Start with current data
    if (isCsSession && volunteer.volunteerType !== "communityService") {
      try {
        const allVolunteers = JSON.parse(
          localStorage.getItem("volunteers") || "[]"
        );
        const updatedVolunteers = allVolunteers.map((v: Volunteer) => {
          if (v.id === volunteer.id) {
            updatedVolunteerData = {
              ...v,
              volunteerType: "communityService",
              serviceReason: csReason,
              serviceInstitution: csInstitution,
            };
            return updatedVolunteerData;
          }
          return v;
        });
        localStorage.setItem("volunteers", JSON.stringify(updatedVolunteers));
        // Update state immediately
        setVolunteer(updatedVolunteerData);
        toast.info("Volunteer profile updated to Community Service.");
      } catch (error) {
        console.error("Error updating volunteer profile:", error);
        toast.error("Could not update volunteer profile. Please try again.");
        setIsCheckingIn(false);
        return; // Stop check-in if profile update fails
      }
    }

    // Create check-in record
    setTimeout(() => {
      const checkInData: VolunteerSession = {
        identifier: updatedVolunteerData.email || updatedVolunteerData.phone,
        program: selectedProgram,
        location: selectedLocation,
        checkInTime: new Date().toISOString(),
        volunteerInfo: {
          id: updatedVolunteerData.id,
          firstName: updatedVolunteerData.firstName,
          lastName: updatedVolunteerData.lastName,
        },
        adminCode: submittedCode,
        isCommunityServiceSession: isCsSession, // Always set based on checkbox now
      };

      // Store in localStorage
      const activeVolunteers = JSON.parse(
        localStorage.getItem("activeVolunteers") || "[]"
      );
      activeVolunteers.push(checkInData);
      localStorage.setItem(
        "activeVolunteers",
        JSON.stringify(activeVolunteers)
      );

      setActiveSession(checkInData);
      setIsCheckingIn(false);
      setAdminCode("");
      setSelectedProgram("");
      setSelectedLocation("");
      setIsCsSession(false);
      setCsReason(""); // Reset temporary CS fields
      setCsInstitution(""); // Reset temporary CS fields

      toast.success("Check-in successful!", {
        description: `You've checked in to ${selectedProgram
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l: string) =>
            l.toUpperCase()
          )} at ${new Date().toLocaleTimeString()}`,
      });
    }, 1500); // Keep timeout for simulating network request
  };

  const handleCheckOut = () => {
    if (!activeSession || !volunteer) return;
    setShowRatingDialog(true);
  };

  const handleRatingSubmit = () => {
    if (!activeSession || !volunteer) return;

    // Calculate hours
    const checkInTime = new Date(activeSession.checkInTime);
    const checkOutTime = new Date();
    const hoursWorked = (
      (checkOutTime.getTime() - checkInTime.getTime()) /
      3600000
    ).toFixed(2);

    // Create completed session record
    const completedSession: VolunteerSession = {
      ...activeSession,
      checkOutTime: checkOutTime.toISOString(),
      hoursWorked,
      rating,
      comments:
        comments.highlights || comments.feedback || comments.issues
          ? JSON.stringify(comments)
          : undefined,
    };

    // Update localStorage
    const completedSessions = JSON.parse(
      localStorage.getItem("completedSessions") || "[]"
    );
    completedSessions.push(completedSession);
    localStorage.setItem(
      "completedSessions",
      JSON.stringify(completedSessions)
    );

    // Remove from active volunteers
    const activeVolunteers = JSON.parse(
      localStorage.getItem("activeVolunteers") || "[]"
    );
    const updatedActive = activeVolunteers.filter(
      (s: VolunteerSession) =>
        !(s.volunteerInfo && s.volunteerInfo.id === volunteer.id)
    );
    localStorage.setItem("activeVolunteers", JSON.stringify(updatedActive));

    setActiveSession(null);
    setVolunteerHistory([completedSession, ...volunteerHistory]);
    setShowRatingDialog(false);
    setRating(0);

    toast.success("Check-out successful!", {
      description: `Thank you for volunteering! You contributed ${hoursWorked} hours.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateTotalHours = () => {
    return volunteerHistory
      .reduce((total, session) => {
        return total + Number.parseFloat(session.hoursWorked || "0");
      }, 0)
      .toFixed(1);
  };

  // Calculate Community Service Hours
  const calculateCsHours = () => {
    return volunteerHistory
      .filter((session) => session.isCommunityServiceSession)
      .reduce((total, session) => {
        return total + Number.parseFloat(session.hoursWorked || "0");
      }, 0)
      .toFixed(1);
  };

  // Calculate Community Service Sessions Count
  const csSessionsCount = volunteerHistory.filter(
    (session) => session.isCommunityServiceSession
  ).length;

  // Determine if CS metrics should be shown
  const showCsMetrics =
    volunteer?.volunteerType === "communityService" || csSessionsCount > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-700" />
      </div>
    );
  }

  if (!volunteer) {
    return null;
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
            <h1 className="text-2xl font-bold">
              Welcome, {volunteer.firstName}!
            </h1>
            <p className="text-gray-600">
              Volunteer Dashboard
              {volunteer.volunteerType === "communityService" && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Briefcase className="mr-1 h-3 w-3" /> Community Service
                </span>
              )}
            </p>
          </div>

          <div className="flex space-x-3">
            <Link href="/">
              <Button
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateTotalHours()}</div>
              <p className="text-xs text-muted-foreground">
                Total hours of service
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Volunteer Since
              </CardTitle>
              <Calendar className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDate(volunteer.registrationDate)}
              </div>
              <p className="text-xs text-muted-foreground">Registration date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <Award className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {volunteerHistory.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total volunteer sessions
              </p>
            </CardContent>
          </Card>

          {showCsMetrics && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CS Hours</CardTitle>
                <Briefcase className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateCsHours()}</div>
                <p className="text-xs text-muted-foreground">
                  Community service hours
                </p>
              </CardContent>
            </Card>
          )}

          {showCsMetrics && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  CS Sessions
                </CardTitle>
                <Briefcase className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{csSessionsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Community service sessions
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>Your volunteer activity</CardDescription>
              </CardHeader>
              <CardContent>
                {activeSession ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <h3 className="font-medium text-green-800 mb-2">
                        Currently Checked In
                      </h3>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Program:</span>{" "}
                        {activeSession.program
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Location:</span>{" "}
                        {activeSession.location
                          ? activeSession.location
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())
                          : "N/A"}
                      </p>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Check-in time:</span>{" "}
                        {formatTime(activeSession.checkInTime)}
                      </p>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Duration:</span>{" "}
                        {Math.round(
                          (new Date().getTime() -
                            new Date(activeSession.checkInTime).getTime()) /
                            60000
                        )}{" "}
                        minutes
                      </p>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleCheckOut}
                        className="w-full bg-red-700 hover:bg-red-800"
                      >
                        Check Out Now
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      You are not currently checked in to any volunteer
                      activity.
                    </p>

                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button className="w-full bg-red-700 hover:bg-red-800">
                            Check In Now
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Volunteer Check-In</DialogTitle>
                          <DialogDescription>
                            Please select a program, location (if applicable),
                            and enter the admin code provided by staff.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="program">Select Program</Label>
                            <select
                              id="program"
                              value={selectedProgram}
                              onChange={(e) =>
                                setSelectedProgram(e.target.value)
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select a program</option>
                              <option value="meal-service">Meal Service</option>
                              <option value="food-pantry">Food Pantry</option>
                              <option value="clothing-drive">
                                Clothing Drive
                              </option>
                              <option value="administrative">
                                Administrative
                              </option>
                              <option value="outreach">
                                Community Outreach
                              </option>
                              <option value="special-events">
                                Special Events
                              </option>
                              <option value="fundraising">Fundraising</option>
                              <option value="facilities">
                                Facilities Maintenance
                              </option>
                            </select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="location">
                              Select Location 
                            </Label>
                            <select
                              id="location"
                              value={selectedLocation}
                              onChange={(e) =>
                                setSelectedLocation(e.target.value)
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select a location</option>
                              <option value="west philadelphia">West Philadelphia</option>
                              <option value="spring garden">
                                SpringGarden
                              </option>
                              <option value="">Ambler</option>
                              <option value="remote">Remote/Other</option>
                            </select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="adminCode">Admin Code</Label>
                            <Input
                              id="adminCode"
                              value={adminCode}
                              onChange={(e) =>
                                setAdminCode(
                                  e.target.value.replace(/\D/g, "").slice(0, 4)
                                )
                              }
                              placeholder="Enter the code provided by staff"
                              type="text"
                              maxLength={4}
                            />
                          </div>

                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                              id="isCsSession"
                              checked={isCsSession}
                              onCheckedChange={(checked) =>
                                setIsCsSession(Boolean(checked))
                              }
                            />
                            <Label
                              htmlFor="isCsSession"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              This session is for Community Service hours
                            </Label>
                          </div>

                          {isCsSession &&
                            volunteer?.volunteerType !== "communityService" && (
                              <div className="space-y-4 border-t pt-4 mt-4">
                                <p className="text-sm text-gray-600">
                                  Please provide your Community Service details
                                  below. This will update your volunteer
                                  profile.
                                </p>
                                <div className="space-y-2">
                                  <Label htmlFor="csReasonDialog">
                                    Reason for Service{" "}
                                    <span className="text-red-700">*</span>
                                  </Label>
                                  <Input
                                    id="csReasonDialog"
                                    value={csReason}
                                    onChange={(e) =>
                                      setCsReason(e.target.value)
                                    }
                                    placeholder="e.g., Court ordered, Employer, or School requirement"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="csInstitutionDialog">
                                    Assigning Institution{" "}
                                    <span className="text-red-700">*</span>
                                  </Label>
                                  <Input
                                    id="csInstitutionDialog"
                                    value={csInstitution}
                                    onChange={(e) =>
                                      setCsInstitution(e.target.value)
                                    }
                                    placeholder="e.g., Philadelphia Municipal Court"
                                    required
                                  />
                                </div>
                              </div>
                            )}
                        </div>

                        <DialogFooter>
                          <Button
                            onClick={handleCheckIn}
                            className="bg-red-700 hover:bg-red-800"
                            disabled={isCheckingIn}
                          >
                            {isCheckingIn ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking in...
                              </>
                            ) : (
                              "Complete Check-In"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>Personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Name:</span>{" "}
                  {volunteer.firstName} {volunteer.lastName}
                </p>
                {volunteer.volunteerType === "communityService" && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">Service Reason:</span>{" "}
                      {volunteer.serviceReason || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">
                        Assigning Institution:
                      </span>{" "}
                      {volunteer.serviceInstitution || "N/A"}
                    </p>
                  </>
                )}
                {volunteer.email && (
                  <p className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    {volunteer.email}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {volunteer.phone}
                </p>
                {volunteer.address && (
                  <p className="text-sm">
                    <span className="font-medium">Address:</span>{" "}
                    {volunteer.address}, {volunteer.city}, {volunteer.state}{" "}
                    {volunteer.zip}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Emergency Contact:</span>{" "}
                  {volunteer.emergencyName} ({volunteer.emergencyPhone})
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              Volunteer History
            </CardTitle>
            <CardDescription>Your past volunteer sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {volunteerHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Program
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Location
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Time In
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Time Out
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Hours</th>
                      {showCsMetrics && (
                        <th className="text-center py-3 px-4 font-medium">
                          CS
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {volunteerHistory.map((session, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {formatDate(session.checkInTime)}
                        </td>
                        <td className="py-3 px-4">
                          {session.program
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </td>
                        <td className="py-3 px-4">
                          {session.location
                            ? session.location
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l: string) =>
                                  l.toUpperCase()
                                )
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {formatTime(session.checkInTime)}
                        </td>
                        <td className="py-3 px-4">
                          {session.checkOutTime
                            ? formatTime(session.checkOutTime)
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {session.hoursWorked}
                        </td>
                        {showCsMetrics && (
                          <td className="py-3 px-4 text-center">
                            {session.isCommunityServiceSession ? (
                              <Briefcase className="h-4 w-4 text-blue-600 inline-block" />
                            ) : (
                              ""
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No volunteer history yet</p>
                <p className="text-sm">
                  Your completed volunteer sessions will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rate Your Experience</DialogTitle>
              <DialogDescription>
                How was your volunteer experience today?
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center space-x-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 ${
                    rating >= star ? "text-red-700" : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                >
                  <Star className="h-8 w-8 fill-current" />
                </Button>
              ))}
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="highlights">Highlights</Label>
                <Input
                  id="highlights"
                  placeholder="What went well during your service?"
                  value={comments.highlights}
                  onChange={(e) =>
                    setComments({ ...comments, highlights: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Input
                  id="feedback"
                  placeholder="Any suggestions for improvement?"
                  value={comments.feedback}
                  onChange={(e) =>
                    setComments({ ...comments, feedback: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issues">Issues</Label>
                <Input
                  id="issues"
                  placeholder="Any problems you encountered?"
                  value={comments.issues}
                  onChange={(e) =>
                    setComments({ ...comments, issues: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hadFun"
                  checked={comments.hadFun}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setComments({ ...comments, hadFun: checked === true })
                  }
                  className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:border-red-800"
                />
                <Label htmlFor="hadFun">I had fun volunteering today</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleRatingSubmit}
                className="bg-red-700 hover:bg-red-800"
                disabled={rating === 0}
              >
                Submit & Finish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
