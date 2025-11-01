"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Download,
  Users,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  Music,
  LogOut,
  History,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  auth,
  signOut,
  getAllVolunteers,
  getAllMusicians,
  getAllActiveVolunteerSessions,
  getAllCompletedVolunteerSessions,
  getAllActiveMusicianSessions,
  getAllCompletedMusicianSessions,
  getAllDonations,
  completeVolunteerSession,
  completeMusicianSession,
  getDailyCode,
  saveDailyCode,
  getCodeAuditLog,
  saveCodeAuditLogEntry,
} from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  interests?: string[];
  registrationDate: string;
  volunteerType: "regular" | "communityService" | string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  skills?: string;
  serviceReason?: string;
  serviceInstitution?: string;
  availability?: any;
  waiverSignature?: string;
}

interface VolunteerSession {
  id: string;
  identifier: string;
  program: string;
  checkInTime: string;
  checkOutTime?: string;
  hoursWorked?: string;
  rating?: number;
  location?: string;
  volunteerInfo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  checkInTimeTimestamp?: Timestamp;
  checkOutTimeTimestamp?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface Musician {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  instruments: string[];
  registrationDate: string;
}

interface MusicianSession {
  id: string;
  musicianId: string;
  activity: string;
  signInTime: string;
  checkOutTime?: string;
  musicianInfo?: {
    id: string;
    firstName: string;
    lastName: string;
    instruments: string[];
  };
  signInTimeTimestamp?: Timestamp;
  checkOutTimeTimestamp?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface Stats {
  totalHours: number;
  totalVolunteers: number;
  totalMusicians: number;
  averageRating: number;
  registeredCount: number;
  registeredMusicians: number;
}

interface DailyCode {
  code: string;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

interface CodeAuditLog {
  id: string;
  code: string;
  action: "created" | "updated" | "generated";
  timestamp: string;
  adminId: string;
}

interface Donation {
  id: string;
  name: string;
  orgName: string;
  email: string;
  phone: string;
  address: string;
  items: string;
  condition: string; 
  method: string; 
  notes: string;
  quantity: string;
  submissionDate: string; 
  submittedAt: string; 
  waiverAccepted: boolean;
  waiverSignature: string; 
  
  preferredContact: {
    email: boolean;
    phone: boolean;
    text: boolean;
  };

  seasonal: {
    allseason: boolean;
    summer: boolean;
    winter: boolean;
  };

  types: {
    accessories: boolean;
    baby: boolean;
    children: boolean;
    men: boolean;
    women: boolean;
  };
}


export default function AdminDashboard() {
  const [activeVolunteers, setActiveVolunteers] = useState<VolunteerSession[]>(
    []
  );
  const [donations, setDonations] = useState<Donation[]>([])
  const [activeMusicians, setActiveMusicians] = useState<MusicianSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<
    VolunteerSession[]
  >([]);
  const [completedMusicianSessions, setCompletedMusicianSessions] = useState<
    MusicianSession[]
  >([]);
  const [registeredVolunteers, setRegisteredVolunteers] = useState<Volunteer[]>(
    []
  );
  const [registeredMusicians, setRegisteredMusicians] = useState<Musician[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalHours: 0,
    totalVolunteers: 0,
    totalMusicians: 0,
    averageRating: 0,
    registeredCount: 0,
    registeredMusicians: 0,
  });
  const [dailyCode, setDailyCode] = useState<DailyCode | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [auditLog, setAuditLog] = useState<CodeAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOutVolunteer, setIsSigningOutVolunteer] = useState<
    string | null
  >(null);
  const [isSigningOutMusician, setIsSigningOutMusician] = useState<
    string | null
  >(null);
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);

  const router = useRouter();

  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const [
        activeVolunteersResult,
        completedSessionsResult,
        registeredVolunteersResult,
        registeredMusiciansResult,
        activeMusiciansResult,
        completedMusiciansResult,
        dailyCodeResult,
        auditLogResult,
        donationsResult
      ] = await Promise.all([
        getAllActiveVolunteerSessions(),
        getAllCompletedVolunteerSessions(),
        getAllVolunteers(),
        getAllMusicians(),
        getAllActiveMusicianSessions(),
        getAllCompletedMusicianSessions(),
        getDailyCode(),
        getCodeAuditLog(),
        getAllDonations()
        
      ]);

      const regVolunteers = registeredVolunteersResult.success
        ? registeredVolunteersResult.data || []
        : [];
      setRegisteredVolunteers(regVolunteers);

      const regMusicians = registeredMusiciansResult.success
        ? registeredMusiciansResult.data || []
        : [];
      setRegisteredMusicians(regMusicians);

      const actVolunteers = activeVolunteersResult.success
        ? activeVolunteersResult.data || []
        : [];
      const compSessions = completedSessionsResult.success
        ? completedSessionsResult.data || []
        : [];

      const enrichVolunteerSession = (session: any) => {
        const volunteer = regVolunteers.find(
          (v) => v.id === session.volunteerInfo?.id
        );
        return {
          ...session,
          volunteerInfo: volunteer
            ? {
                id: volunteer.id,
                firstName: volunteer.firstName,
                lastName: volunteer.lastName,
              }
            : session.volunteerInfo,
          identifier: session.volunteerInfo?.id
            ? `${session.volunteerInfo.firstName} ${session.volunteerInfo.lastName}`
            : session.identifier || "Unknown ID",
          checkInTime: session.checkInTimeTimestamp?.toDate
            ? session.checkInTimeTimestamp.toDate().toISOString()
            : session.checkInTime,
          checkOutTime: session.checkOutTimeTimestamp?.toDate
            ? session.checkOutTimeTimestamp.toDate().toISOString()
            : session.checkOutTime,
        };
      };

      setActiveVolunteers(actVolunteers.map(enrichVolunteerSession));
      setCompletedSessions(compSessions.map(enrichVolunteerSession));

      const actMusicians = activeMusiciansResult.success
        ? activeMusiciansResult.data || []
        : [];
      const compMusicianSessions = completedMusiciansResult.success
        ? completedMusiciansResult.data || []
        : [];

      const enrichMusicianSession = (session: any) => {
        const musician = regMusicians.find((m) => m.id === session.musicianId);
        return {
          ...session,
          musicianInfo: musician
            ? {
                id: musician.id,
                firstName: musician.firstName,
                lastName: musician.lastName,
                instruments: musician.instruments,
              }
            : null,
          signInTime: session.signInTimeTimestamp?.toDate
            ? session.signInTimeTimestamp.toDate().toISOString()
            : session.signInTime,
          checkOutTime: session.checkOutTimeTimestamp?.toDate
            ? session.checkOutTimeTimestamp.toDate().toISOString()
            : session.checkOutTime,
        };
      };

      setActiveMusicians(actMusicians.map(enrichMusicianSession));
      setCompletedMusicianSessions(
        compMusicianSessions.map(enrichMusicianSession)
      );

      const totalVolunteerHours = compSessions.reduce(
        (sum: number, session: VolunteerSession) =>
          sum + Number.parseFloat(session.hoursWorked || "0"),
        0
      );
      const ratingsCount = compSessions?.filter(
        (s: VolunteerSession) => s.rating && s.rating > 0
      ).length;
      const ratingsSum = compSessions.reduce(
        (sum: number, session: VolunteerSession) => sum + (session.rating || 0),
        0
      );

      setStats({
        totalHours: Number.parseFloat(totalVolunteerHours.toFixed(2)),
        totalVolunteers: compSessions.length,
        totalMusicians: compMusicianSessions.length,
        averageRating:
          ratingsCount > 0
            ? Number.parseFloat((ratingsSum / ratingsCount).toFixed(1))
            : 0,
        registeredCount: regVolunteers.length,
        registeredMusicians: regMusicians.length,
      });

      if (dailyCodeResult.success && dailyCodeResult.data) {
        if (dailyCodeResult.data.code && dailyCodeResult.data.createdBy) {
          setDailyCode(dailyCodeResult.data as DailyCode);
        } else {
          console.warn(
            "Fetched daily code data is incomplete:",
            dailyCodeResult.data
          );
          setDailyCode(null);
          toast.error("Failed to load daily code: Incomplete data received.");
        }
      } else {
        setDailyCode(null);
        if (
          dailyCodeResult.error &&
          dailyCodeResult.message !== "Daily code not set" &&
          dailyCodeResult.message !== "Daily code expired"
        ) {
          console.error(
            "Error loading daily code:",
            dailyCodeResult.error || dailyCodeResult.message
          );
          toast.error("Failed to load daily code");
        }
      }

      if (auditLogResult.success && auditLogResult.data) {
        setAuditLog(auditLogResult.data);
      } else {
        setAuditLog([]);
        if (auditLogResult.error) {
          console.error("Error loading audit log:", auditLogResult.error);
          toast.error("Failed to load code audit log");
        }
      }
      if(donationsResult.success && donationsResult.data) {
        setDonations(donationsResult.data);
        if (donationsResult.error) {
          console.error("Error loading audit log:", donationsResult.error);
          toast.error("Failed to load code audit log");
        }

      }

      if (!activeVolunteersResult.success)
        console.error(
          "Failed to load active volunteers:",
          activeVolunteersResult.error
        );
      if (!completedSessionsResult.success)
        console.error(
          "Failed to load completed sessions:",
          completedSessionsResult.error
        );
      if (!registeredVolunteersResult.success)
        console.error(
          "Failed to load registered volunteers:",
          registeredVolunteersResult.error
        );
      if (!registeredMusiciansResult.success)
        console.error(
          "Failed to load registered musicians:",
          registeredMusiciansResult.error
        );
      if (!activeMusiciansResult.success)
        console.error(
          "Failed to load active musicians:",
          activeMusiciansResult.error
        );
      if (!completedMusiciansResult.success)
        console.error(
          "Failed to load completed musician sessions:",
          completedMusiciansResult.error
        );
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data. Please try refreshing.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date =
      typeof dateString === "string"
        ? new Date(dateString)
        : (dateString as any)?.toDate
        ? (dateString as any).toDate()
        : null;
    return date ? date.toLocaleDateString() : "Invalid Date";
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date =
      typeof dateString === "string"
        ? new Date(dateString)
        : (dateString as any)?.toDate
        ? (dateString as any).toDate()
        : null;
    return date
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "Invalid Time";
  };

  const getVolunteerType = useCallback(
    (volunteerId: string): string => {
      const volunteer = registeredVolunteers.find((v) => v.id === volunteerId);
      if (!volunteer || !volunteer.volunteerType) return "Unknown";
      return volunteer.volunteerType === "communityService"
        ? "Community Service"
        : "Regular";
    },
    [registeredVolunteers]
  );

  const generateCsv = (
    headers: string[],
    rows: string[][],
    filename: string
  ) => {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${(cell || "").toString().replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported successfully`);
  };

  const exportRegisteredVolunteers = () => {
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Type",
      "Interests",
      "Address",
      "City",
      "State",
      "ZIP",
      "Emergency Name",
      "Emergency Phone",
      "Skills",
      "Service Reason",
      "Service Institution",
      "Registration Date",
    ];
    const rows = registeredVolunteers.map((v) => [
      v.id,
      v.firstName,
      v.lastName,
      v.email || "",
      v.phone,
      v.volunteerType === "communityService" ? "Community Service" : "Regular",
      v.interests?.join("; ") || "",
      v.address || "",
      v.city || "",
      v.state || "",
      v.zip || "",
      v.emergencyName || "",
      v.emergencyPhone || "",
      v.skills || "",
      v.serviceReason || "",
      v.serviceInstitution || "",
      formatDate(v.registrationDate),
    ]);
    generateCsv(
      headers,
      rows,
      `registered-volunteers-${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  const exportCompletedVolunteerSessions = () => {
    const headers = [
      "Volunteer Name",
      "Volunteer Type",
      "Email",
      "Location",
      "Check-in Time",
      "Check-out Time",
      "Hours Worked",
      "Rating",
    ];
    const rows = completedSessions.map((session) => [
      session.volunteerInfo
        ? `${session.volunteerInfo.firstName} ${session.volunteerInfo.lastName}`
        : session.identifier,
      session.volunteerInfo
        ? getVolunteerType(session.volunteerInfo.id)
        : "Unknown",
      session.volunteerInfo
        ? registeredVolunteers.find((v) => v.id === session.volunteerInfo?.id)
            ?.email || "No email"
        : "Unknown",
      session.location || "N/A",
      formatTime(session.checkInTime),
      session.checkOutTime ? formatTime(session.checkOutTime) : "",
      session.hoursWorked || "",
      session.rating ? `${session.rating}/5` : "N/A",
    ]);
    generateCsv(
      headers,
      rows,
      `completed-volunteer-sessions-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
  };

  const exportRegisteredMusicians = () => {
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Instruments",
      "Registration Date",
    ];
    const rows = registeredMusicians.map((m) => [
      m.id,
      m.firstName,
      m.lastName,
      m.email || "",
      m.phone,
      m.instruments?.join("; ") || "",
      formatDate(m.registrationDate),
    ]);
    generateCsv(
      headers,
      rows,
      `registered-musicians-${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  const exportCompletedMusicianSessions = () => {
    const headers = [
      "Musician Name",
      "Instruments",
      "Activity",
      "Sign-in Time",
      "Sign-out Time",
      "Duration (min)",
    ];
    const rows = completedMusicianSessions.map((session) => {
      const musicianInfo =
        session.musicianInfo ||
        registeredMusicians.find((m) => m.id === session.musicianId);
      const duration =
        session.checkOutTime && session.signInTime
          ? Math.round(
              (new Date(session.checkOutTime).getTime() -
                new Date(session.signInTime).getTime()) /
                60000
            )
          : "";
      return [
        musicianInfo
          ? `${musicianInfo.firstName} ${musicianInfo.lastName}`
          : "Unknown",
        musicianInfo?.instruments?.join("; ") || "",
        session.activity.replace(/\b\w/g, (l: string) => l.toUpperCase()),
        formatTime(session.signInTime),
        session.checkOutTime ? formatTime(session.checkOutTime) : "",
        duration.toString(),
      ];
    });
    generateCsv(
      headers,
      rows,
      `completed-musician-sessions-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
  };

  const filteredVolunteers = registeredVolunteers.filter((volunteer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      volunteer.firstName?.toLowerCase().includes(searchLower) ||
      volunteer.lastName?.toLowerCase().includes(searchLower) ||
      volunteer.email?.toLowerCase().includes(searchLower) ||
      volunteer.phone?.toLowerCase().includes(searchLower)
    );
  });

  const generateCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setNewCode(code);
  };

  const saveCode = async (codeToSave: string) => {
    setIsUpdatingCode(true);
    const formattedCode = codeToSave.padStart(4, "0").slice(0, 4);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const codeData: Omit<DailyCode, "createdAt" | "id"> & {
      expiresAt: string;
    } = {
      code: formattedCode,
      expiresAt: tomorrow.toISOString(),
      createdBy: auth.currentUser?.email || "admin",
    };

    const logAction = dailyCode ? "updated" : "generated";

    try {
      const saveResult = await saveDailyCode(codeData);
      if (!saveResult.success) {
        throw saveResult.error || new Error("Failed to save daily code");
      }

      const logEntry = {
        code: formattedCode,
        action: logAction as "created" | "updated" | "generated",
        adminId: auth.currentUser?.email || "admin",
      };
      const logResult = await saveCodeAuditLogEntry(logEntry);
      if (!logResult.success) {
        console.error("Failed to save code audit log:", logResult.error);
        toast.warning("Daily code updated, but failed to log action.");
      } else {
        toast.success(`Daily code ${logAction} successfully`);
      }

      await loadDashboardData();
      setNewCode("");
    } catch (error) {
      console.error(`Error ${logAction} daily code:`, error);
      toast.error(`Failed to ${logAction} daily code. Please try again.`);
    } finally {
      setIsUpdatingCode(false);
    }
  };

  const handleVolunteerSignOut = async (sessionIndex: number) => {
    const sessionToSignOut = activeVolunteers[sessionIndex];
    if (!sessionToSignOut || !sessionToSignOut.id) {
      toast.error("Invalid session data. Cannot sign out.");
      return;
    }

    setIsSigningOutVolunteer(sessionToSignOut.id);

    const checkOutTime = new Date();
    const checkInTime = new Date(sessionToSignOut.checkInTime);
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    const hoursWorked = (durationMs / (1000 * 60 * 60)).toFixed(2);

    const completedSessionData: Partial<VolunteerSession> = {
      ...sessionToSignOut,
      checkOutTime: checkOutTime.toISOString(),
      hoursWorked: hoursWorked,
      checkInTimeTimestamp: undefined,
      checkOutTimeTimestamp: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    delete completedSessionData.checkInTimeTimestamp;
    delete completedSessionData.checkOutTimeTimestamp;
    delete completedSessionData.createdAt;
    delete completedSessionData.updatedAt;

    try {
      const result = await completeVolunteerSession(
        sessionToSignOut.id,
        completedSessionData
      );
      if (result.success) {
        toast.success(
          `${
            sessionToSignOut.volunteerInfo?.firstName || "Volunteer"
          } signed out successfully.`
        );
        await loadDashboardData();
      } else {
        throw result.error || new Error("Firestore operation failed");
      }
    } catch (error) {
      console.error("Error signing out volunteer:", error);
      toast.error("Failed to sign out volunteer. Please try again.");
    } finally {
      setIsSigningOutVolunteer(null);
    }
  };

  const handleMusicianSignOut = async (sessionIndex: number) => {
    const sessionToSignOut = activeMusicians[sessionIndex];
    if (!sessionToSignOut || !sessionToSignOut.id) {
      toast.error("Invalid musician session data. Cannot sign out.");
      return;
    }

    setIsSigningOutMusician(sessionToSignOut.id);

    const checkOutTime = new Date().toISOString();

    const completedSessionData: Partial<MusicianSession> = {
      ...sessionToSignOut,
      checkOutTime: checkOutTime,
      signInTimeTimestamp: undefined,
      checkOutTimeTimestamp: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    delete completedSessionData.signInTimeTimestamp;
    delete completedSessionData.checkOutTimeTimestamp;
    delete completedSessionData.createdAt;
    delete completedSessionData.updatedAt;
    delete completedSessionData.musicianInfo;

    try {
      const result = await completeMusicianSession(
        sessionToSignOut.id,
        completedSessionData
      );

      if (result.success) {
        const musicianName = sessionToSignOut.musicianInfo
          ? `${sessionToSignOut.musicianInfo.firstName} ${sessionToSignOut.musicianInfo.lastName}`
          : "Musician";
        toast.success(`${musicianName} signed out successfully.`);
        await loadDashboardData();
      } else {
        throw result.error || new Error("Firestore operation failed");
      }
    } catch (error) {
      console.error("Error signing out musician:", error);
      toast.error("Failed to sign out musician. Please try again.");
    } finally {
      setIsSigningOutMusician(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.push("/admin/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Sign out failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="h-8 w-8 animate-spin text-red-700" />
        <span className="ml-2 text-lg">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            onClick={loadDashboardData}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="w-full sm:w-auto justify-center"
          >
            {isRefreshing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            Refresh Data
          </Button>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto justify-center bg-red-700 hover:bg-red-800"
          >
            <LogOut className="mr-1 h-3 w-3" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full">
        <Button
          onClick={exportRegisteredVolunteers}
          variant="outline"
          size="sm"
          className="flex-1 min-w-[180px] justify-center"
        >
          <Users className="mr-1 h-3 w-3" /> Export Registered Volunteers
        </Button>
        <Button
          onClick={exportCompletedVolunteerSessions}
          variant="outline"
          size="sm"
          className="flex-1 min-w-[180px] justify-center"
        >
          <Clock className="mr-1 h-3 w-3" /> Export Completed Sessions
        </Button>
        <Button
          onClick={exportRegisteredMusicians}
          variant="outline"
          size="sm"
          className="flex-1 min-w-[180px] justify-center"
        >
          <Music className="mr-1 h-3 w-3" /> Export Registered Musicians
        </Button>
        <Button
          onClick={exportCompletedMusicianSessions}
          variant="outline"
          size="sm"
          className="flex-1 min-w-[180px] justify-center"
        >
          <History className="mr-1 h-3 w-3" /> Export Musician Sessions
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
            <p className="text-xs text-muted-foreground">Hours of service</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Volunteer Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
            <p className="text-xs text-muted-foreground">Unique sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Musician Sessions
            </CardTitle>
            <Music className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMusicians}</div>
            <p className="text-xs text-muted-foreground">Unique sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Calendar className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}/5</div>
            <p className="text-xs text-muted-foreground">
              Volunteer satisfaction
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registered Volunteers
            </CardTitle>
            <Users className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registeredCount}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registered Musicians
            </CardTitle>
            <Music className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.registeredMusicians}
            </div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold">
              Daily Check-in Code
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {dailyCode
                ? `Valid until ${new Date(
                    dailyCode.expiresAt
                  ).toLocaleString()}`
                : "No active code set in Firestore"}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowCode(!showCode)}
            disabled={!dailyCode}
          >
            {showCode ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  maxLength={4}
                  placeholder="Enter/Generate 4-digit code"
                  value={newCode}
                  onChange={(e) =>
                    setNewCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  disabled={isUpdatingCode}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={generateCode}
                title="Generate random code"
                disabled={isUpdatingCode}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() =>
                  saveCode(
                    newCode ||
                      dailyCode?.code ||
                      Math.floor(1000 + Math.random() * 9000).toString()
                  )
                }
                className="bg-red-700 hover:bg-red-800 min-w-[110px]"
                disabled={
                  isUpdatingCode || (newCode.length > 0 && newCode.length < 4)
                }
              >
                {isUpdatingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : dailyCode ? (
                  "Update Code"
                ) : (
                  "Set Code"
                )}
              </Button>
            </div>

            {dailyCode && (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Current Active Code:</p>
                <p className="text-2xl font-bold font-mono">
                  {showCode ? dailyCode.code : "••••"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Set by: {dailyCode.createdBy} on{" "}
                  {formatDate(dailyCode.createdAt)}
                </p>
              </div>
            )}

            {auditLog.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-md font-semibold mb-2">
                  Code Change History (Last {auditLog.length})
                </h4>
                <div className="max-h-40 overflow-y-auto text-sm space-y-1 text-muted-foreground pr-2">
                  {auditLog.map((log) => (
                    <p key={log.id}>
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        {log.code}
                      </span>{" "}
                      {log.action} by {log.adminId} at{" "}
                      {formatTime(log.timestamp)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList className="bg-gray-100 h-auto flex flex-wrap justify-start">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-red-700 data-[state=active]:text-white"
          >
            Active Volunteers ({activeVolunteers.length})
          </TabsTrigger>
          <TabsTrigger
            value="active-musicians"
            className="data-[state=active]:bg-red-700 data-[state=active]:text-white"
          >
            Active Musicians ({activeMusicians.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-red-700 data-[state=active]:text-white"
          >
            Completed Sessions ({completedSessions.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed-musicians"
            className="data-[state=active]:bg-red-700 data-[state=active]:text-white"
          >
            Completed Musician Sessions ({completedMusicianSessions.length})
          </TabsTrigger>
          <TabsTrigger
            value="registered"
            className="data-[state=active]:bg-red-700 data-[state=active]:text-white"
          >
            Registered Volunteers ({registeredVolunteers.length})
          </TabsTrigger>
          <TabsTrigger
            value="registered-musicians"
            className="data-[state=active]:bg-red-700 data-[state=active]:text-white"
          >
            Registered Musicians ({registeredMusicians.length})
          </TabsTrigger>
          <TabsTrigger
            value="donations"
            className="data-[state=active]:bg-red-700 data-[state=active]:text-white"
          >
            Donations ({donations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="border rounded-md p-0 md:p-4">
          {activeVolunteers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeVolunteers.map((volunteer, index) => (
                    <TableRow key={volunteer.id}>
                      <TableCell>{volunteer.identifier}</TableCell>
                      <TableCell>
                        {volunteer.volunteerInfo
                          ? getVolunteerType(volunteer.volunteerInfo.id)
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {volunteer.volunteerInfo
                          ? registeredVolunteers.find(
                              (v) => v.id === volunteer.volunteerInfo?.id
                            )?.email || "No email"
                          : "Unknown"}
                      </TableCell>
                      <TableCell>{volunteer.location || "N/A"}</TableCell>
                      <TableCell>{formatDate(volunteer.checkInTime)}</TableCell>
                      <TableCell>
                        {volunteer.checkInTime
                          ? `${Math.round(
                              (new Date().getTime() -
                                new Date(volunteer.checkInTime).getTime()) /
                                60000
                            )} min`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVolunteerSignOut(index)}
                          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 min-w-[90px]"
                          disabled={isSigningOutVolunteer === volunteer.id}
                        >
                          {isSigningOutVolunteer === volunteer.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <LogOut className="mr-1 h-3 w-3" />
                          )}
                          Sign Out
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground p-4">
              No active volunteers found in Firestore
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="active-musicians"
          className="border rounded-md p-0 md:p-4"
        >
          {activeMusicians.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Musician</TableHead>
                    <TableHead>Instrument(s)</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMusicians.map((musicianSession, index) => {
                    const musicianInfo = musicianSession.musicianInfo;
                    return (
                      <TableRow key={musicianSession.id}>
                        <TableCell>
                          {musicianInfo
                            ? `${musicianInfo.firstName} ${musicianInfo.lastName}`
                            : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {musicianInfo &&
                          Array.isArray(musicianInfo.instruments) &&
                          musicianInfo.instruments.length > 0
                            ? musicianInfo.instruments.join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {musicianSession.activity.replace(
                            /\b\w/g,
                            (l: string) => l.toUpperCase()
                          )}
                        </TableCell>
                        <TableCell>
                          {formatTime(musicianSession.signInTime)}
                        </TableCell>
                        <TableCell>
                          {musicianSession.signInTime
                            ? `${Math.round(
                                (new Date().getTime() -
                                  new Date(
                                    musicianSession.signInTime
                                  ).getTime()) /
                                  60000
                              )} min`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMusicianSignOut(index)}
                            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 min-w-[90px]"
                            disabled={
                              isSigningOutMusician === musicianSession.id
                            }
                          >
                            {isSigningOutMusician === musicianSession.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <LogOut className="mr-1 h-3 w-3" />
                            )}
                            Sign Out
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground p-4">
              No active musicians found in Firestore
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="border rounded-md p-0 md:p-4">
          {completedSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedSessions?.map((session) => (
                    <TableRow key={session?.id}>
                      <TableCell>{session?.identifier}</TableCell>
                      <TableCell>
                        {session?.volunteerInfo
                          ? getVolunteerType(session?.volunteerInfo?.id)
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {session?.volunteerInfo
                          ? registeredVolunteers.find(
                              (v) => v.id === session?.volunteerInfo?.id
                            )?.email || "No email"
                          : "Unknown"}
                      </TableCell>
                      <TableCell>{session.location || "N/A"}</TableCell>
                      <TableCell>{formatDate(session.checkInTime)}</TableCell>
                      <TableCell>{session.hoursWorked || "N/A"}</TableCell>
                      <TableCell>
                        {session.rating ? `${session.rating}/5` : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground p-4">
              No completed volunteer sessions found in Firestore
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="completed-musicians"
          className="border rounded-md p-0 md:p-4"
        >
          {completedMusicianSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Musician</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedMusicianSessions.map((session) => {
                    const musicianInfo = session.musicianInfo;
                    const duration =
                      session.checkOutTime && session.signInTime
                        ? Math.round(
                            (new Date(session.checkOutTime).getTime() -
                              new Date(session.signInTime).getTime()) /
                              60000
                          )
                        : null;
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          {musicianInfo
                            ? `${musicianInfo.firstName} ${musicianInfo.lastName}`
                            : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {musicianInfo &&
                          Array.isArray(musicianInfo.instruments) &&
                          musicianInfo.instruments.length > 0
                            ? musicianInfo.instruments.join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {session.activity?.replace(/\b\w/g, (l: string) =>
                            l.toUpperCase()
                          )}
                        </TableCell>
                        <TableCell>{formatDate(session.signInTime)}</TableCell>
                        <TableCell>
                          {duration !== null ? duration : "N/A"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground p-4">
              No completed musician sessions found in Firestore
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="registered"
          className="border rounded-md p-0 md:p-4"
        >
          <div className="mb-4 flex items-center">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search volunteers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredVolunteers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Interests</TableHead>
                    <TableHead>Registration Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVolunteers.map((volunteer) => (
                    <TableRow key={volunteer.id}>
                      <TableCell>
                        {volunteer.firstName} {volunteer.lastName}
                      </TableCell>
                      <TableCell>
                        <div>{volunteer.email || "-"}</div>
                        <div>{volunteer.phone}</div>
                      </TableCell>
                      <TableCell>
                        {volunteer.volunteerType === "communityService"
                          ? "Community Service"
                          : "Regular"}
                      </TableCell>
                      <TableCell>
                        {volunteer.interests && volunteer.interests.length > 0
                          ? volunteer.interests.join(", ")
                          : "None specified"}
                      </TableCell>
                      <TableCell>
                        {formatDate(volunteer.registrationDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground p-4">
              {searchTerm
                ? "No volunteers match your search in Firestore"
                : "No registered volunteers found in Firestore"}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="registered-musicians"
          className="border rounded-md p-0 md:p-4"
        >
          {registeredMusicians.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Instrument(s)</TableHead>
                    <TableHead>Registration Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredMusicians.map((musician) => (
                    <TableRow key={musician.id}>
                      <TableCell>
                        {musician.firstName} {musician.lastName}
                      </TableCell>
                      <TableCell>
                        <div>{musician.email || "-"}</div>
                        <div>{musician.phone}</div>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(musician.instruments) &&
                        musician.instruments.length > 0
                          ? musician.instruments.join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(musician.registrationDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground p-4">
              No registered musicians found in Firestore
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="donations"
          className="border rounded-md p-0 md:p-4"
        >
          {donations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Number of Bags</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Seasonal Items</TableHead>
                    <TableHead>Type of Clothing</TableHead>
                    <TableHead>Drop off site</TableHead>
                    <TableHead>Submission Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => {
                    const seasonalItems = [];
                    if (donation.seasonal?.allseason) seasonalItems.push("All Season");
                    if (donation.seasonal?.summer) seasonalItems.push("Summer");
                    if (donation.seasonal?.winter) seasonalItems.push("Winter");

                    const clothingTypes = [];
                    if (donation.types?.accessories) clothingTypes.push("Accessories");
                    if (donation.types?.baby) clothingTypes.push("Baby");
                    if (donation.types?.children) clothingTypes.push("Children");
                    if (donation.types?.men) clothingTypes.push("Men");
                    if (donation.types?.women) clothingTypes.push("Women");

                    return (
                      <TableRow key={donation.id}>
                        <TableCell>{donation.name}</TableCell>
                        <TableCell>{donation.orgName || "-"}</TableCell>
                        <TableCell>
                          <div>{donation.email || "-"}</div>
                          <div>{donation.phone}</div>
                        </TableCell>
                        <TableCell>{donation.quantity || "-"}</TableCell>
                        <TableCell>
                          {donation.condition
                            ? donation.condition.charAt(0).toUpperCase() +
                              donation.condition.slice(1)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {seasonalItems.length > 0 ? seasonalItems.join(", ") : "-"}
                        </TableCell>
                        <TableCell>
                          {clothingTypes.length > 0 ? clothingTypes.join(", ") : "-"}
                        </TableCell>
                        <TableCell>
                          {donation.method
                            ? donation.method.charAt(0).toUpperCase() +
                              donation.method.slice(1)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {formatDate(donation.submissionDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground p-4">
              No donations found in Firestore
            </div>
          )}
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
