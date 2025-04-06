"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Download, Users, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export default function AdminDashboard() {
  const [activeVolunteers, setActiveVolunteers] = useState<any[]>([])
  const [completedSessions, setCompletedSessions] = useState<any[]>([])
  const [registeredVolunteers, setRegisteredVolunteers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState({
    totalHours: 0,
    totalVolunteers: 0,
    averageRating: 0,
    registeredCount: 0,
  })

  useEffect(() => {
    // In a real app, this would be an API call
    const active = JSON.parse(localStorage.getItem("activeVolunteers") || "[]")
    const completed = JSON.parse(localStorage.getItem("completedSessions") || "[]")
    const registered = JSON.parse(localStorage.getItem("volunteers") || "[]")

    setActiveVolunteers(active)
    setCompletedSessions(completed)
    setRegisteredVolunteers(registered)

    // Calculate stats
    if (completed.length > 0) {
      const totalHours = completed.reduce(
        (sum: number, session: any) => sum + Number.parseFloat(session.hoursWorked),
        0,
      )

      const ratingsCount = completed.filter((s: any) => s.rating > 0).length
      const ratingsSum = completed.reduce((sum: number, session: any) => sum + (session.rating || 0), 0)

      setStats({
        totalHours: Number.parseFloat(totalHours.toFixed(2)),
        totalVolunteers: completed.length,
        averageRating: ratingsCount > 0 ? Number.parseFloat((ratingsSum / ratingsCount).toFixed(1)) : 0,
        registeredCount: registered.length,
      })
    } else {
      setStats((prev) => ({
        ...prev,
        registeredCount: registered.length,
      }))
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const exportData = () => {
    // In a real app, this would generate a CSV file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(completedSessions))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "volunteer-data.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()

    toast.success("Data exported successfully", {
      description: "Your volunteer data has been downloaded as a JSON file.",
    })
  }

  const filteredVolunteers = registeredVolunteers.filter((volunteer) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      volunteer.firstName.toLowerCase().includes(searchLower) ||
      volunteer.lastName.toLowerCase().includes(searchLower) ||
      volunteer.email.toLowerCase().includes(searchLower) ||
      volunteer.phone.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={exportData} className="bg-red-700 hover:bg-red-800">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
            <Users className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
            <p className="text-xs text-muted-foreground">Unique volunteers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Calendar className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}/5</div>
            <p className="text-xs text-muted-foreground">Volunteer satisfaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Volunteers</CardTitle>
            <Users className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registeredCount}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="active" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            Active Volunteers ({activeVolunteers.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            Completed Sessions ({completedSessions.length})
          </TabsTrigger>
          <TabsTrigger value="registered" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            Registered Volunteers ({registeredVolunteers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="border rounded-md p-4">
          {activeVolunteers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeVolunteers.map((volunteer, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {volunteer.volunteerInfo
                        ? `${volunteer.volunteerInfo.firstName} ${volunteer.volunteerInfo.lastName}`
                        : volunteer.identifier}
                    </TableCell>
                    <TableCell>
                      {volunteer.program.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </TableCell>
                    <TableCell>{formatTime(volunteer.checkInTime)}</TableCell>
                    <TableCell>
                      {Math.round((new Date().getTime() - new Date(volunteer.checkInTime).getTime()) / 60000)} min
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No active volunteers at this time</div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="border rounded-md p-4">
          {completedSessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Program</TableHead>
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
                      {session.program.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </TableCell>
                    <TableCell>{formatDate(session.checkInTime)}</TableCell>
                    <TableCell>{session.hoursWorked}</TableCell>
                    <TableCell>{session.rating ? `${session.rating}/5` : "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No completed sessions yet</div>
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
                      {volunteer.interests && volunteer.interests.length > 0
                        ? volunteer.interests.join(", ")
                        : "None specified"}
                    </TableCell>
                    <TableCell>{formatDate(volunteer.registrationDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm ? "No volunteers match your search" : "No registered volunteers yet"}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

