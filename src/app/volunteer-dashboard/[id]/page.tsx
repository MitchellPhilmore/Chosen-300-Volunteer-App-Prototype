"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
import {
  getVolunteerById,
  saveActiveMusicianSession,
  getActiveVolunteerSession,
  getCompletedVolunteerSessions,
  saveActiveVolunteerSession,
  completeVolunteerSession,
  saveVolunteer,
  getDailyCode,
} from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/i18n-context";

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  volunteerType?: "regular" | "communityService" | "employment";
  serviceReason?: string;
  serviceReasonOther?: string;
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
  id: string;
  identifier: string;
  location: string;
  checkInTime: string;
  checkOutTime?: string | undefined;
  hoursWorked?: string;
  volunteerInfo: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rating?: number;
  comments?: string;
  isCommunityServiceSession?: boolean;
  checkInTimeTimestamp?: Timestamp;
  checkOutTimeTimestamp?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Add this line to get the default code from environment variables
const DEFAULT_ADMIN_CODE = process.env.NEXT_PUBLIC_DEFAULT_ADMIN_CODE;

export default function VolunteerDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const router = useRouter();
  const { t } = useI18n();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminCode, setAdminCode] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
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
  const [error, setError] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState<
    VolunteerSession[]
  >([]);
  const sessionMode = searchParams.get("mode");
  const isSessionSpecialized =
    volunteer?.volunteerType === "employment" || isCsSession;

  useEffect(() => {
    async function loadVolunteer() {
      setLoading(true);
      try {
        // First try to get volunteer from Firestore
        const result = await getVolunteerById(id as string);

        if (result.success && result.data) {
          setVolunteer(result.data as Volunteer);
        } else {
          // Fall back to localStorage if Firestore fails
          const localVolunteers = JSON.parse(
            localStorage.getItem("volunteers") || "[]"
          );
          const localVolunteer = localVolunteers.find((v: any) => v.id === id);

          if (localVolunteer) {
            setVolunteer(localVolunteer);
          } else {
            setError(t("volunteerDashboard.errors.volunteerNotFound"));
          }
        }

        // Load active session if it exists
        const activeSessionResult = await getActiveVolunteerSession(id);
        if (activeSessionResult.success && activeSessionResult.data) {
          const sessionData = activeSessionResult.data as VolunteerSession;
          sessionData.id = activeSessionResult.sessionId;
          setActiveSession(sessionData);
        }

        // Load completed sessions
        const completedSessionsResult = await getCompletedVolunteerSessions(id);
        if (completedSessionsResult.success && completedSessionsResult.data) {
          setVolunteerHistory(
            completedSessionsResult.data as VolunteerSession[]
          );
        } else {
          // Fall back to localStorage for completed sessions
          const localSessions = JSON.parse(
            localStorage.getItem("completedSessions") || "[]"
          );
          const volunteerSessions = localSessions.filter(
            (s: VolunteerSession) =>
              s.volunteerInfo && s.volunteerInfo.id === id
          );
          setVolunteerHistory(volunteerSessions);
        }
      } catch (err) {
        console.error("Error loading volunteer data:", err);
        setError(t("volunteerDashboard.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadVolunteer();
    }
  }, [id]);

  useEffect(() => {
    if (!volunteer) return;

    if (volunteer.volunteerType === "employment") {
      setIsCsSession(true);
      return;
    }

    if (volunteer.volunteerType === "communityService") {
      setIsCsSession(sessionMode !== "volunteer");
      return;
    }

    setIsCsSession(false);
  }, [volunteer, sessionMode]);

  const handleCheckIn = async () => {
    if (!volunteer) return;

    // Admin code required only for specialized sessions (CS/Employment)
    if (isSessionSpecialized && !adminCode) {
      toast.error(t("volunteerDashboard.toasts.enterAdminCode"));
      return;
    }

    if (!selectedLocation) {
      toast.error(t("volunteerDashboard.toasts.selectLocation"));
      return;
    }

    // Only validate CS reason and institution for CS volunteers or CS sessions
    if (
      isCsSession &&
      volunteer.volunteerType !== "communityService" &&
      volunteer.volunteerType !== "employment"
    ) {
      if (!csReason) {
        toast.error(t("volunteerDashboard.toasts.enterCsReason"));
        return;
      }
      if (!csInstitution) {
        toast.error(t("volunteerDashboard.toasts.enterCsInstitution"));
        return;
      }
    }

    // --- Begin Daily Code Validation --- //
    setIsCheckingIn(true);

    const redirectHomeForNextUser = () => {
      localStorage.removeItem("appLocale");
      router.push("/");
    };

    try {
      // Validate code only for specialized sessions (CS/Employment)
      if (isSessionSpecialized) {
        const dailyCodeResult = await getDailyCode();
        const submittedCode = adminCode.padStart(4, "0");

        // If the daily code is working and valid, check against it
        if (dailyCodeResult.success && dailyCodeResult.data) {
          // Use type assertion correctly by first casting to unknown
          const dailyCode = dailyCodeResult.data as unknown as { code: string };
          const storedCode = dailyCode.code.padStart(4, "0");

          // Check against daily code or default admin code (if set)
          if (
            submittedCode !== storedCode &&
            (DEFAULT_ADMIN_CODE ? submittedCode !== DEFAULT_ADMIN_CODE : true)
          ) {
            toast.error(t("volunteerDashboard.toasts.invalidCheckinCodeTitle"), {
              description:
                t("volunteerDashboard.toasts.invalidCheckinCodeDescription"),
            });
            setAdminCode("");
            setIsCheckingIn(false);
            return;
          }
        }
        // If daily code is not available, check against default admin code
        else if (!DEFAULT_ADMIN_CODE || submittedCode !== DEFAULT_ADMIN_CODE) {
          // If default code isn't set, show appropriate message
          const errorMessage = !DEFAULT_ADMIN_CODE
            ? t("volunteerDashboard.toasts.noBackupCode")
            : t("volunteerDashboard.toasts.dailyCodeUnavailable");

          toast.error(t("volunteerDashboard.toasts.invalidCheckinCodeTitle"), {
            description: errorMessage,
          });
          setAdminCode("");
          setIsCheckingIn(false);
          return;
        }
      }

      // --- Code is valid or not required, proceed with check-in logic --- //

      let updatedVolunteerData = { ...volunteer };
      if (
        isCsSession &&
        volunteer.volunteerType !== "communityService" &&
        volunteer.volunteerType !== "employment"
      ) {
        try {
          updatedVolunteerData = {
            ...volunteer,
            volunteerType: "communityService",
            serviceReason: csReason,
            serviceInstitution: csInstitution,
          };
          const updateResult = await saveVolunteer(updatedVolunteerData);
          if (!updateResult.success) {
            throw updateResult.error || new Error("Failed to update profile");
          }
          setVolunteer(updatedVolunteerData);
          toast.info(t("volunteerDashboard.toasts.profileUpdatedToCs"));
        } catch (error) {
          console.error("Error updating volunteer profile:", error);
          toast.error(t("volunteerDashboard.toasts.profileUpdateFailed"));
          setIsCheckingIn(false);
          return;
        }
      }

      // Create check-in record (without id)
      const checkInData: Omit<VolunteerSession, "id"> = {
        identifier: updatedVolunteerData.email || updatedVolunteerData.phone,
        location: selectedLocation,
        checkInTime: new Date().toISOString(),
        volunteerInfo: {
          id: updatedVolunteerData.id,
          firstName: updatedVolunteerData.firstName,
          lastName: updatedVolunteerData.lastName,
        },
        isCommunityServiceSession:
          isSessionSpecialized,
      };

      // For normal volunteers, automatically create a completed session with 4-hour duration
      if (!isSessionSpecialized) {
        const checkInTime = new Date();
        const checkOutTime = new Date(checkInTime);
        checkOutTime.setHours(checkOutTime.getHours() + 4);

        const hoursWorked = "4.00"; // Fixed 4 hours

        const completedSessionData: Omit<VolunteerSession, "id"> = {
          ...checkInData,
          checkOutTime: checkOutTime.toISOString(),
          hoursWorked,
          rating: 5, // Default rating
        };

        // Generate a unique session ID
        const sessionId = `${updatedVolunteerData.id}_${Date.now()}`;

        // Save completed session directly
        const result = await completeVolunteerSession(
          sessionId,
          completedSessionData
        );

        if (result.success) {
          toast.success(t("volunteerDashboard.toasts.checkinSuccessTitle"), {
            description: t("volunteerDashboard.toasts.autoCheckinDescription"),
          });

          // Reload completed sessions
          await loadCompletedSessions();

          // Redirect to home page
          setTimeout(() => {
            toast.info(t("volunteerDashboard.toasts.redirectingHome"));
            redirectHomeForNextUser();
          }, 4000);
        } else {
          throw result.error || new Error("Failed to save session");
        }
      } else {
        // For CS volunteers and employment, continue with the normal active session flow
        const result = await saveActiveVolunteerSession(checkInData);

        if (result.success && result.sessionId) {
          // Construct the full session object for local state
          const newActiveSession: VolunteerSession = {
            ...checkInData,
            id: result.sessionId,
          };
          setActiveSession(newActiveSession);

          toast.success(t("volunteerDashboard.toasts.checkinSuccessTitle"), {
            description: `You've checked in at ${new Date().toLocaleTimeString()}`,
          });

          // Redirect to home page for CS volunteers as well
          setTimeout(() => {
            toast.info(t("volunteerDashboard.toasts.redirectingHome"));
            redirectHomeForNextUser();
          }, 2500); // Redirect after 2.5 seconds
        } else {
          throw result.error || new Error("Failed to save active session");
        }
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast.error(t("volunteerDashboard.toasts.checkinFailedTitle"), {
        description:
          (error instanceof Error
            ? error.message
            : t("volunteerDashboard.toasts.tryAgain")) +
          ` ${t("volunteerDashboard.toasts.contactSupport")}`,
      });
    } finally {
      setIsCheckingIn(false);
      setAdminCode("");
      setSelectedLocation("");
      setIsCsSession(false);
      setCsReason("");
      setCsInstitution("");
    }
  };

  const handleCheckOut = () => {
    if (!activeSession || !volunteer) return;
    setShowRatingDialog(true);
  };

  const handleRatingSubmit = async () => {
    if (!activeSession || !volunteer || !activeSession.id) return;

    const checkInTime = new Date(activeSession.checkInTime);
    const checkOutTime = new Date();
    const hoursWorked = (
      (checkOutTime.getTime() - checkInTime.getTime()) /
      3600000
    ).toFixed(2);

    // Prepare the completed session data, excluding the id initially
    const completedSessionData: Omit<VolunteerSession, "id"> = {
      identifier: activeSession.identifier,
      location: activeSession.location,
      checkInTime: activeSession.checkInTime,
      volunteerInfo: activeSession.volunteerInfo,
      isCommunityServiceSession: activeSession.isCommunityServiceSession,
      checkOutTime: checkOutTime.toISOString(),
      hoursWorked,
      rating,
      checkInTimeTimestamp: undefined,
      checkOutTimeTimestamp: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    // Ensure undefined fields are removed if the base activeSession included them
    delete completedSessionData.checkInTimeTimestamp;
    delete completedSessionData.checkOutTimeTimestamp;
    delete completedSessionData.createdAt;
    delete completedSessionData.updatedAt;

    try {
      // Use the correct session ID from the active session state
      const sessionId = activeSession.id;
      // Call completeVolunteerSession with ID and the data payload
      const result = await completeVolunteerSession(
        sessionId,
        completedSessionData
      );

      if (result.success) {
        setActiveSession(null);
        setRating(0);
        setShowRatingDialog(false);
        loadCompletedSessions();

        toast.success(t("volunteerDashboard.toasts.checkoutSuccessTitle"), {
          description: `You worked ${hoursWorked} hours. Thank you for your time!`,
        });

        // Redirect to home page after check-out
        setTimeout(() => {
          toast.info(t("volunteerDashboard.toasts.redirectingHome"));
          router.push("/");
        }, 2500); // Redirect after 2.5 seconds
      } else {
        throw result.error || new Error("Firestore operation failed");
      }
    } catch (error) {
      console.error("Error during check-out:", error);
      toast.error(t("volunteerDashboard.toasts.checkoutFailedTitle"), {
        description: `${t("volunteerDashboard.toasts.tryAgain")} ${t(
          "volunteerDashboard.toasts.contactSupport"
        )}`,
      });
    } finally {
      setShowRatingDialog(false);
    }
  };

  // Load completed sessions on mount and after check-out
  const loadCompletedSessions = useCallback(async () => {
    if (!volunteer) return;
    const result = await getCompletedVolunteerSessions(volunteer.id);
    if (result.success && result.data) {
      setCompletedSessions(result.data);
    } else {
      setCompletedSessions([]);
    }
  }, [volunteer]);

  useEffect(() => {
    if (volunteer) {
      loadCompletedSessions();
    }
  }, [volunteer, loadCompletedSessions]);

  // Calculate total hours
  const totalHours = useMemo(() => {
    return completedSessions
      .reduce((sum, session) => sum + parseFloat(session.hoursWorked || "0"), 0)
      .toFixed(2);
  }, [completedSessions]);

  const csHours = useMemo(() => {
    return completedSessions
      .filter((s) => s.isCommunityServiceSession)
      .reduce((sum, session) => sum + parseFloat(session.hoursWorked || "0"), 0)
      .toFixed(2);
  }, [completedSessions]);

  // Calculate Community Service Sessions Count
  const csSessionsCount = volunteerHistory.filter(
    (session) => session.isCommunityServiceSession
  ).length;

  // Determine if CS metrics should be shown
  const showCsMetrics =
    volunteer?.volunteerType === "communityService" || csSessionsCount > 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-700" />
        <span className="ml-2">{t("volunteerDashboard.loading")}</span>
      </div>
    );
  }

  if (error || !volunteer) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-700">{t("common.error")}</CardTitle>
            <CardDescription>
              {error || t("volunteerDashboard.errors.volunteerNotFound")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              {t("volunteerDashboard.errors.checkUrl")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format the registration date
  const registrationDate = new Date(
    volunteer.registrationDate
  ).toLocaleDateString();

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
              {t("volunteerDashboard.welcome")}, {volunteer.firstName}!
            </h1>
            <p className="text-gray-600">
              {volunteer.volunteerType === "employment"
                ? t("volunteerDashboard.employeeDashboard")
                : t("volunteerDashboard.volunteerDashboard")}
              {volunteer.volunteerType === "communityService" && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Briefcase className="mr-1 h-3 w-3" />{" "}
                  {t("volunteerDashboard.communityService")}
                </span>
              )}
              {volunteer.volunteerType === "employment" && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Briefcase className="mr-1 h-3 w-3" />{" "}
                  {t("volunteerDashboard.employee")}
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
                {t("volunteerDashboard.signOut")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("volunteerDashboard.totalHours")}
              </CardTitle>
              <Clock className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours}</div>
              <p className="text-xs text-muted-foreground">
                {t("volunteerDashboard.totalHoursOfService")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("volunteerDashboard.volunteerSince")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{registrationDate}</div>
              <p className="text-xs text-muted-foreground">
                {t("volunteerDashboard.registrationDate")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("volunteerDashboard.totalSessions")}
              </CardTitle>
              <Award className="h-4 w-4 text-red-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {volunteerHistory.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("volunteerDashboard.totalVolunteerSessions")}
              </p>
            </CardContent>
          </Card>

          {showCsMetrics && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("volunteerDashboard.csHours")}
                </CardTitle>
                <Briefcase className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{csHours}</div>
                <p className="text-xs text-muted-foreground">
                  {t("volunteerDashboard.communityServiceHours")}
                </p>
              </CardContent>
            </Card>
          )}

          {showCsMetrics && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("volunteerDashboard.csSessions")}
                </CardTitle>
                <Briefcase className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{csSessionsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {t("volunteerDashboard.communityServiceSessions")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{t("volunteerDashboard.currentStatus")}</CardTitle>
                <CardDescription>
                  {volunteer.volunteerType === "employment"
                    ? t("volunteerDashboard.employmentActivity")
                    : t("volunteerDashboard.volunteerActivity")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeSession ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <h3 className="font-medium text-green-800 mb-2">
                        {t("volunteerDashboard.currentlyCheckedIn")}
                      </h3>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">
                          {t("volunteerDashboard.location")}:
                        </span>{" "}
                        {activeSession.location
                          ? activeSession.location
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())
                          : t("common.notAvailable")}
                      </p>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">
                          {t("volunteerDashboard.checkInTime")}:
                        </span>{" "}
                        {formatTime(activeSession.checkInTime)}
                      </p>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">
                          {t("volunteerDashboard.duration")}:
                        </span>{" "}
                        {Math.round(
                          (new Date().getTime() -
                            new Date(activeSession.checkInTime).getTime()) /
                            60000
                        )}{" "}
                        {t("volunteerDashboard.minutes")}
                      </p>
                    </div>

                    {/* Only show check-out button for community service volunteers */}
                    {(volunteer.volunteerType === "communityService" ||
                      activeSession.isCommunityServiceSession) && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={handleCheckOut}
                          className="w-full bg-red-700 hover:bg-red-800"
                        >
                          {t("volunteerDashboard.checkOutNow")}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      {t("volunteerDashboard.notCheckedIn")}
                    </p>

                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button className="w-full bg-red-700 hover:bg-red-800">
                            {t("volunteerDashboard.checkInNow")}
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {volunteer.volunteerType === "employment"
                              ? t("volunteerDashboard.modal.applicationCheckInTitle")
                              : t("volunteerDashboard.modal.volunteerCheckInTitle")}
                          </DialogTitle>
                          <DialogDescription>
                            {isSessionSpecialized
                              ? volunteer.volunteerType === "employment"
                                ? t("volunteerDashboard.modal.applicationCheckInDescription")
                                : t("volunteerDashboard.modal.specializedCheckInDescription")
                              : t("volunteerDashboard.modal.regularCheckInDescription")}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="location">
                              {t("volunteerDashboard.modal.selectLocationLabel")}
                            </Label>
                            <select
                              id="location"
                              value={selectedLocation}
                              onChange={(e) =>
                                setSelectedLocation(e.target.value)
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">
                                {t("volunteerDashboard.modal.selectLocationPlaceholder")}
                              </option>
                              <option value="West Philadelphia">
                                {t("register.westPhiladelphia")}
                              </option>
                              <option value="Spring Garden">
                                {t("register.springGarden")}
                              </option>
                              <option value="Ambler">{t("register.ambler")}</option>
                              <option value="Reading">{t("register.reading")}</option>
                              <option value="Remote/Other">
                                {t("volunteerDashboard.modal.remoteOther")}
                              </option>
                            </select>
                          </div>

                          {/* Only show admin code for specialized sessions */}
                          {isSessionSpecialized && (
                            <div className="grid gap-2">
                              <Label htmlFor="adminCode">
                                {t("volunteerDashboard.modal.adminCodeLabel")}
                              </Label>
                              <Input
                                id="adminCode"
                                value={adminCode}
                                onChange={(e) =>
                                  setAdminCode(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 4)
                                  )
                                }
                                placeholder={t(
                                  "volunteerDashboard.modal.adminCodePlaceholder"
                                )}
                                type="text"
                                maxLength={4}
                              />
                            </div>
                          )}

                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                              id="isCsSession"
                              checked={isCsSession}
                              disabled={volunteer.volunteerType === "employment"}
                              onCheckedChange={(checked) =>
                                setIsCsSession(Boolean(checked))
                              }
                            />
                            <Label
                              htmlFor="isCsSession"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {volunteer.volunteerType === "employment"
                                ? t("volunteerDashboard.modal.employeeSessionLabel")
                                : t("volunteerDashboard.modal.communityServiceSessionLabel")}
                            </Label>
                          </div>

                          {/* Add notice about automatic checkout for normal volunteers */}
                          {!isSessionSpecialized && (
                              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">
                                    {t("volunteerDashboard.modal.noteLabel")}
                                  </span>{" "}
                                  {t("volunteerDashboard.modal.autoCheckoutNotice")}
                                </p>
                              </div>
                            )}

                          {isCsSession &&
                            volunteer?.volunteerType !== "communityService" &&
                            volunteer?.volunteerType !== "employment" && (
                              <div className="space-y-4 border-t pt-4 mt-4">
                                <p className="text-sm text-gray-600">
                                  {t("volunteerDashboard.modal.communityServiceDetails")}
                                </p>
                                <div className="space-y-2">
                                  <Label htmlFor="csReasonDialog">
                                    {t("register.reasonForService")}{" "}
                                    <span className="text-red-700">*</span>
                                  </Label>
                                  <Select
                                    value={csReason}
                                    onValueChange={setCsReason}
                                  >
                                    <SelectTrigger id="csReasonDialog">
                                      <SelectValue
                                        placeholder={t("register.selectReason")}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="court-ordered">
                                        {t("register.courtOrdered")}
                                      </SelectItem>
                                      <SelectItem value="school">
                                        {t("register.school")}
                                      </SelectItem>
                                      <SelectItem value="work">
                                        {t("register.work")}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="csInstitutionDialog">
                                    {t("register.assigningInstitution")}{" "}
                                    <span className="text-red-700">*</span>
                                  </Label>
                                  <Input
                                    id="csInstitutionDialog"
                                    value={csInstitution}
                                    onChange={(e) =>
                                      setCsInstitution(e.target.value)
                                    }
                                    placeholder={t(
                                      "volunteerDashboard.modal.assigningInstitutionPlaceholder"
                                    )}
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
                                {t("volunteerDashboard.modal.checkingIn")}
                              </>
                            ) : (
                              t("volunteerDashboard.modal.completeCheckIn")
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
                <CardTitle>{t("volunteerDashboard.yourInformation")}</CardTitle>
                <CardDescription>
                  {t("volunteerDashboard.personalDetails")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">
                    {t("volunteerDashboard.name")}:
                  </span>{" "}
                  {volunteer.firstName} {volunteer.lastName}
                </p>
                {(volunteer.volunteerType === "communityService" ||
                  volunteer.volunteerType === "employment") && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">
                        {volunteer.volunteerType === "employment"
                          ? `${t("volunteerDashboard.employeeType")}:`
                          : `${t("volunteerDashboard.serviceReason")}:`}
                      </span>{" "}
                      {volunteer.serviceReason === "other"
                        ? volunteer.serviceReasonOther
                        : volunteer.serviceReason === "court-ordered"
                        ? "Court ordered"
                        : volunteer.serviceReason}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">
                        {volunteer.volunteerType === "employment"
                          ? `${t("volunteerDashboard.referringOrganization")}:`
                          : `${t("volunteerDashboard.assigningInstitution")}:`}
                      </span>{" "}
                      {volunteer.serviceInstitution}
                    </p>
                  </>
                )}
                {volunteer.email && (
                  <p className="text-sm">
                    <span className="font-medium">
                      {t("volunteerDashboard.email")}:
                    </span>{" "}
                    {volunteer.email}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">
                    {t("volunteerDashboard.phone")}:
                  </span>{" "}
                  {volunteer.phone}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              {volunteer.volunteerType === "employment"
                ? t("volunteerDashboard.employeeHistory")
                : t("volunteerDashboard.volunteerHistory")}
            </CardTitle>
            <CardDescription>
              {volunteer.volunteerType === "employment"
                ? t("volunteerDashboard.pastEmployeeSessions")
                : t("volunteerDashboard.pastVolunteerSessions")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {volunteerHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        {t("volunteerDashboard.table.date")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        {t("volunteerDashboard.table.location")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        {t("volunteerDashboard.table.timeIn")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        {t("volunteerDashboard.table.timeOut")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        {t("volunteerDashboard.table.hours")}
                      </th>
                      {showCsMetrics && (
                        <th className="text-center py-3 px-4 font-medium">
                          {t("volunteerDashboard.table.cs")}
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
                          {session.location
                            ? session.location
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l: string) =>
                                  l.toUpperCase()
                                )
                            : t("common.notAvailable")}
                        </td>
                        <td className="py-3 px-4">
                          {formatTime(session.checkInTime)}
                        </td>
                        <td className="py-3 px-4">
                          {session.checkOutTime
                            ? formatTime(session.checkOutTime)
                            : t("common.notAvailable")}
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
                <p>
                  {volunteer.volunteerType === "employment"
                    ? t("volunteerDashboard.noShiftHistory")
                    : t("volunteerDashboard.noVolunteerHistory")}
                </p>
                <p className="text-sm">
                  {volunteer.volunteerType === "employment"
                    ? t("volunteerDashboard.completedShiftsAppear")
                    : t("volunteerDashboard.completedVolunteerSessionsAppear")}
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

            <div className="flex justify-center space-x-2 py-6">
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
