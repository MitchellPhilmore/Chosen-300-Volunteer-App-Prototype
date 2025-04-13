"use client";

import { useCallback, useEffect, useState } from "react";
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
}

interface VolunteerSession {
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
}

interface CodeAuditLog {
  code: string;
  action: "created" | "updated" | "generated";
  timestamp: string;
  adminId: string;
}

export default function AdminDashboard() {
  const [activeVolunteers, setActiveVolunteers] = useState<VolunteerSession[]>(
    []
  );
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

  const loadDashboardData = useCallback(() => {
    const active = JSON.parse(localStorage.getItem("activeVolunteers") || "[]");
    const completed = JSON.parse(
      localStorage.getItem("completedSessions") || "[]"
    );
    const registered = JSON.parse(localStorage.getItem("volunteers") || "[]");
    const musicians = JSON.parse(localStorage.getItem("musicians") || "[]");
    const musicianSignIns = JSON.parse(
      localStorage.getItem("musicianSignIns") || "[]"
    );

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);

    const activeMusiciansData = musicianSignIns.filter(
      (session: MusicianSession) => {
        const signInTime = new Date(session.signInTime);
        return signInTime >= midnight && !session.checkOutTime;
      }
    );

    const completedMusiciansData = musicianSignIns.filter(
      (session: MusicianSession) => {
        const signInTime = new Date(session.signInTime);
        return session.checkOutTime || signInTime < midnight;
      }
    );

    setActiveVolunteers(active);
    setCompletedSessions(completed);
    setRegisteredVolunteers(registered);
    setRegisteredMusicians(musicians);
    setActiveMusicians(activeMusiciansData);
    setCompletedMusicianSessions(completedMusiciansData);

    const totalVolunteerHours = completed.reduce(
      (sum: number, session: VolunteerSession) =>
        sum + Number.parseFloat(session.hoursWorked || "0"),
      0
    );
    const ratingsCount = completed.filter(
      (s: VolunteerSession) => s.rating && s.rating > 0
    ).length;
    const ratingsSum = completed.reduce(
      (sum: number, session: VolunteerSession) => sum + (session.rating || 0),
      0
    );

    setStats({
      totalHours: Number.parseFloat(totalVolunteerHours.toFixed(2)),
      totalVolunteers: completed.length,
      totalMusicians: completedMusiciansData.length,
      averageRating:
        ratingsCount > 0
          ? Number.parseFloat((ratingsSum / ratingsCount).toFixed(1))
          : 0,
      registeredCount: registered.length,
      registeredMusicians: musicians.length,
    });

    const savedCode = localStorage.getItem("dailyCode");
    if (savedCode) {
      const parsedCode = JSON.parse(savedCode);
      if (new Date(parsedCode.expiresAt) > new Date()) {
        setDailyCode(parsedCode);
      } else {
        setDailyCode(null);
        localStorage.removeItem("dailyCode");
      }
    }

    const savedAuditLog = localStorage.getItem("codeAuditLog");
    if (savedAuditLog) {
      setAuditLog(JSON.parse(savedAuditLog));
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      "Program",
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
      session.program
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase()),
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
      const musicianInfo = registeredMusicians.find(
        (m) => m.id === session.musicianId
      );
      const duration = session.checkOutTime
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
      volunteer.firstName.toLowerCase().includes(searchLower) ||
      volunteer.lastName.toLowerCase().includes(searchLower) ||
      volunteer.email?.toLowerCase().includes(searchLower) ||
      volunteer.phone.toLowerCase().includes(searchLower)
    );
  });

  const generateCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setNewCode(code);
  };

  const saveCode = (code: string) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const formattedCode = code.padStart(4, "0").slice(0, 4);

    const codeData: DailyCode = {
      code: formattedCode,
      expiresAt: tomorrow.toISOString(),
      createdAt: now.toISOString(),
      createdBy: "admin",
    };

    localStorage.setItem("dailyCode", JSON.stringify(codeData));
    setDailyCode(codeData);

    const logEntry: CodeAuditLog = {
      code: formattedCode,
      action: newCode ? "updated" : "generated",
      timestamp: now.toISOString(),
      adminId: "admin",
    };

    const updatedLog = [logEntry, ...auditLog].slice(0, 100);
    localStorage.setItem("codeAuditLog", JSON.stringify(updatedLog));
    setAuditLog(updatedLog);

    setNewCode("");
    toast.success("Daily code updated successfully");
  };

  const handleVolunteerSignOut = (sessionIndex: number) => {
    const sessionToSignOut = activeVolunteers[sessionIndex];
    if (!sessionToSignOut) return;

    const checkOutTime = new Date();
    const checkInTime = new Date(sessionToSignOut.checkInTime);
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    const hoursWorked = (durationMs / (1000 * 60 * 60)).toFixed(2);

    const completedSession: VolunteerSession = {
      ...sessionToSignOut,
      checkOutTime: checkOutTime.toISOString(),
      hoursWorked: hoursWorked,
    };

    const updatedActiveVolunteers = activeVolunteers.filter(
      (_, index) => index !== sessionIndex
    );
    const updatedCompletedSessions = [...completedSessions, completedSession];

    setActiveVolunteers(updatedActiveVolunteers);
    setCompletedSessions(updatedCompletedSessions);

    localStorage.setItem(
      "activeVolunteers",
      JSON.stringify(updatedActiveVolunteers)
    );
    localStorage.setItem(
      "completedSessions",
      JSON.stringify(updatedCompletedSessions)
    );

    toast.success(
      `${
        sessionToSignOut.volunteerInfo?.firstName || "Volunteer"
      } signed out successfully.`
    );
  };

  const handleMusicianSignOut = (sessionIndex: number) => {
    const sessionToSignOut = activeMusicians[sessionIndex];
    if (!sessionToSignOut) return;

    const allSignIns: MusicianSession[] = JSON.parse(
      localStorage.getItem("musicianSignIns") || "[]"
    );

    const updatedSignIns = allSignIns.map((session) => {
      if (
        session.musicianId === sessionToSignOut.musicianId &&
        session.signInTime === sessionToSignOut.signInTime
      ) {
        return {
          ...session,
          checkOutTime: new Date().toISOString(),
        };
      }
      return session;
    });

    localStorage.setItem("musicianSignIns", JSON.stringify(updatedSignIns));

    const musicianInfo = registeredMusicians.find(
      (m) => m.id === sessionToSignOut.musicianId
    );
    const musicianName = musicianInfo
      ? `${musicianInfo.firstName} ${musicianInfo.lastName}`
      : "Musician";

    toast.success(`${musicianName} signed out successfully.`);

    loadDashboardData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Button
            onClick={exportRegisteredVolunteers}
            variant="outline"
            size="sm"
          >
            <Users className="mr-1 h-3 w-3" /> Export Registered Volunteers
          </Button>
          <Button
            onClick={exportCompletedVolunteerSessions}
            variant="outline"
            size="sm"
          >
            <Clock className="mr-1 h-3 w-3" /> Export Completed Sessions
          </Button>
          <Button
            onClick={exportRegisteredMusicians}
            variant="outline"
            size="sm"
          >
            <Music className="mr-1 h-3 w-3" /> Export Registered Musicians
          </Button>
          <Button
            onClick={exportCompletedMusicianSessions}
            variant="outline"
            size="sm"
          >
            <History className="mr-1 h-3 w-3" /> Export Musician Sessions
          </Button>
        </div>
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
              Total Volunteers
            </CardTitle>
            <Users className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
            <p className="text-xs text-muted-foreground">Unique volunteers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Musicians
            </CardTitle>
            <Music className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMusicians}</div>
            <p className="text-xs text-muted-foreground">Unique musicians</p>
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
                : "No active code"}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowCode(!showCode)}
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
                  placeholder="Enter 4-digit code"
                  value={newCode}
                  onChange={(e) =>
                    setNewCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={generateCode}
                title="Generate random code"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() =>
                  saveCode(
                    newCode ||
                      Math.floor(1000 + Math.random() * 9000).toString()
                  )
                }
                className="bg-red-700 hover:bg-red-800"
                disabled={newCode.length > 0 && newCode.length < 4}
              >
                {dailyCode ? "Update Code" : "Set Code"}
              </Button>
            </div>

            {dailyCode && (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Current Code:</p>
                <p className="text-2xl font-bold font-mono">
                  {showCode ? dailyCode.code : "••••"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList className="bg-gray-100">
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
        </TabsList>

        <TabsContent value="active" className="border rounded-md p-4">
          {activeVolunteers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeVolunteers.map((volunteer, index) => (
                  <TableRow
                    key={`${volunteer.identifier}-${volunteer.checkInTime}`}
                  >
                    <TableCell>
                      {volunteer.volunteerInfo
                        ? `${volunteer.volunteerInfo.firstName} ${volunteer.volunteerInfo.lastName}`
                        : volunteer.identifier}
                    </TableCell>
                    <TableCell>
                      {volunteer.volunteerInfo
                        ? getVolunteerType(volunteer.volunteerInfo.id)
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {volunteer.program
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </TableCell>
                    <TableCell>{volunteer.location || "N/A"}</TableCell>
                    <TableCell>{formatTime(volunteer.checkInTime)}</TableCell>
                    <TableCell>
                      {Math.round(
                        (new Date().getTime() -
                          new Date(volunteer.checkInTime).getTime()) /
                          60000
                      )}{" "}
                      min
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVolunteerSignOut(index)}
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="mr-1 h-3 w-3" />
                        Sign Out
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No active volunteers at this time
            </div>
          )}
        </TabsContent>

        <TabsContent value="active-musicians" className="border rounded-md p-4">
          {activeMusicians.length > 0 ? (
            <Table>
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
                  const musicianInfo = registeredMusicians.find(
                    (m) => m.id === musicianSession.musicianId
                  );
                  return (
                    <TableRow
                      key={`${musicianSession.musicianId}-${musicianSession.signInTime}`}
                    >
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
                        {Math.round(
                          (new Date().getTime() -
                            new Date(musicianSession.signInTime).getTime()) /
                            60000
                        )}{" "}
                        min
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMusicianSignOut(index)}
                          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <LogOut className="mr-1 h-3 w-3" />
                          Sign Out
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No active musicians at this time
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="border rounded-md p-4">
          {completedSessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedSessions.map((session, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {session.volunteerInfo
                        ? `${session.volunteerInfo.firstName} ${session.volunteerInfo.lastName}`
                        : session.identifier}
                    </TableCell>
                    <TableCell>
                      {session.volunteerInfo
                        ? getVolunteerType(session.volunteerInfo.id)
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {session.program
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </TableCell>
                    <TableCell>{session.location || "N/A"}</TableCell>
                    <TableCell>{formatDate(session.checkInTime)}</TableCell>
                    <TableCell>{session.hoursWorked}</TableCell>
                    <TableCell>
                      {session.rating ? `${session.rating}/5` : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No completed sessions yet
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="completed-musicians"
          className="border rounded-md p-4"
        >
          {completedMusicianSessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Musician</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedMusicianSessions.map((session, index) => {
                  const musicianInfo = registeredMusicians.find(
                    (m) => m.id === session.musicianId
                  );
                  return (
                    <TableRow key={index}>
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
                        {session.activity.replace(/\b\w/g, (l: string) =>
                          l.toUpperCase()
                        )}
                      </TableCell>
                      <TableCell>{formatDate(session.signInTime)}</TableCell>
                      <TableCell>
                        {Math.round(
                          (new Date(session.signInTime).getTime() -
                            new Date(
                              session.checkOutTime || new Date()
                            ).getTime()) /
                            60000
                        )}{" "}
                        min
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No completed musician sessions yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="registered" className="border rounded-md p-4">
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
            <Table>
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
                {filteredVolunteers.map((volunteer, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {volunteer.firstName} {volunteer.lastName}
                    </TableCell>
                    <TableCell>
                      <div>{volunteer.email}</div>
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
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm
                ? "No volunteers match your search"
                : "No registered volunteers yet"}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="registered-musicians"
          className="border rounded-md p-4"
        >
          <div className="mb-4 flex items-center">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search musicians..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {registeredMusicians.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Instrument(s)</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registeredMusicians.map((musician, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {musician.firstName} {musician.lastName}
                    </TableCell>
                    <TableCell>
                      <div>{musician.email}</div>
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
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No registered musicians yet
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
