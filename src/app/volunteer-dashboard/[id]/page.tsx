"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Calendar, Award, History, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

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

export default function VolunteerDashboard() {
  // Use the useParams hook to get the id parameter from the URL
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  const [volunteer, setVolunteer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminCode, setAdminCode] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [volunteerHistory, setVolunteerHistory] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);

  useEffect(() => {
    // Fetch volunteer data
    const volunteers = JSON.parse(localStorage.getItem("volunteers") || "[]");
    const foundVolunteer = volunteers.find((v: any) => v.id === id);

    if (foundVolunteer) {
      setVolunteer(foundVolunteer);

      // Check if volunteer has an active session
      const activeVolunteers = JSON.parse(
        localStorage.getItem("activeVolunteers") || "[]"
      );
      const currentSession = activeVolunteers.find(
        (s: any) => s.volunteerInfo && s.volunteerInfo.id === id
      );

      if (currentSession) {
        setActiveSession(currentSession);
      }

      // Get volunteer history
      const completedSessions = JSON.parse(
        localStorage.getItem("completedSessions") || "[]"
      );
      const history = completedSessions.filter(
        (s: any) => s.volunteerInfo && s.volunteerInfo.id === id
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
    if (!adminCode) {
      toast.error("Please enter the admin code");
      return;
    }

    if (!selectedProgram) {
      toast.error("Please select a program");
      return;
    }

    setIsCheckingIn(true);

    // In a real app, you would validate the admin code against a database
    // For demo purposes, we'll accept any code
    setTimeout(() => {
      // Create check-in record
      const checkInData = {
        identifier: volunteer.email || volunteer.phone,
        program: selectedProgram,
        checkInTime: new Date().toISOString(),
        volunteerInfo: {
          id: volunteer.id,
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
        },
        adminCode,
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

      toast.success("Check-in successful!", {
        description: `You've checked in to ${selectedProgram
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l: string) =>
            l.toUpperCase()
          )} at ${new Date().toLocaleTimeString()}`,
      });
    }, 1500);
  };

  const handleCheckOut = () => {
    if (!activeSession) return;

    // Calculate hours
    const checkInTime = new Date(activeSession.checkInTime);
    const checkOutTime = new Date();
    const hoursWorked = (
      (checkOutTime.getTime() - checkInTime.getTime()) /
      3600000
    ).toFixed(2);

    // Create completed session record
    const completedSession = {
      ...activeSession,
      checkOutTime: checkOutTime.toISOString(),
      hoursWorked,
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
      (s: any) => !(s.volunteerInfo && s.volunteerInfo.id === volunteer.id)
    );
    localStorage.setItem("activeVolunteers", JSON.stringify(updatedActive));

    setActiveSession(null);
    setVolunteerHistory([completedSession, ...volunteerHistory]);

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
        return total + Number.parseFloat(session.hoursWorked);
      }, 0)
      .toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-700" />
      </div>
    );
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
            <p className="text-gray-600">Volunteer Dashboard</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateTotalHours()}</div>
              <p className="text-xs text-muted-foreground">Hours of service</p>
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
                Sessions Completed
              </CardTitle>
              <Award className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {volunteerHistory.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Volunteer sessions
              </p>
            </CardContent>
          </Card>
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
                            Please select a program and enter the admin code
                            provided by staff.
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
                            <Label htmlFor="adminCode">Admin Code</Label>
                            <Input
                              id="adminCode"
                              value={adminCode}
                              onChange={(e) => setAdminCode(e.target.value)}
                              placeholder="Enter the code provided by staff"
                            />
                          </div>
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Program
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Time In
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Time Out
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Hours</th>
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
                          {formatTime(session.checkInTime)}
                        </td>
                        <td className="py-3 px-4">
                          {formatTime(session.checkOutTime)}
                        </td>
                        <td className="py-3 px-4">{session.hoursWorked}</td>
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
      </motion.div>
    </div>
  );
}
