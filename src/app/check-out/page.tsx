"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAutoReturn } from "@/hooks/use-auto-return"

export default function CheckOut() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState("")
  const [session, setSession] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Auto-return to home after 60 seconds of inactivity
  useAutoReturn()

  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier) return

    // In a real app, you would fetch this from a database
    const activeVolunteers = JSON.parse(localStorage.getItem("activeVolunteers") || "[]")
    const volunteerSession = activeVolunteers.find((v: any) => v.identifier === identifier)

    if (volunteerSession) {
      setSession(volunteerSession)
      setStep(2)
    } else {
      toast.error("No active session found", {
        description: "We couldn't find an active check-in with this identifier.",
      })
    }
  }

  const handleCheckOut = () => {
    setIsLoading(true)

    // Simulate API call to check out volunteer
    setTimeout(() => {
      // In a real app, you would update this in a database
      const activeVolunteers = JSON.parse(localStorage.getItem("activeVolunteers") || "[]")
      const updatedVolunteers = activeVolunteers.filter((v: any) => v.identifier !== identifier)
      localStorage.setItem("activeVolunteers", JSON.stringify(updatedVolunteers))

      // Calculate hours (in a real app, store this in a completed sessions table)
      const checkInTime = new Date(session.checkInTime)
      const checkOutTime = new Date()
      const hoursWorked = ((checkOutTime.getTime() - checkInTime.getTime()) / 3600000).toFixed(2)

      const completedSessions = JSON.parse(localStorage.getItem("completedSessions") || "[]")
      completedSessions.push({
        ...session,
        checkOutTime: checkOutTime.toISOString(),
        hoursWorked,
        rating,
      })
      localStorage.setItem("completedSessions", JSON.stringify(completedSessions))

      setStep(3)
      setIsLoading(false)
    }, 1000)
  }

  const handleRatingSubmit = () => {
    toast.success("Thank you!", {
      description: "Your feedback has been recorded.",
    })
    router.push("/")
  }

  const goBack = () => {
    if (step > 1 && step < 3) {
      setStep(step - 1)
    } else {
      router.push("/")
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={goBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Volunteer Check-Out</CardTitle>
              <CardDescription>
                {step === 1 ? "Enter your identifier" : step === 2 ? "Confirm your session" : "Rate your experience"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleIdentifierSubmit}>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Phone Number</Label>
                  <Input
                    id="identifier"
                    placeholder="Enter your email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-6 bg-red-700 hover:bg-red-800">
                Find My Session
              </Button>
            </form>
          )}

          {step === 2 && session && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Active Session</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Program:</strong>{" "}
                    {session.program.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                  <p>
                    <strong>Check-in time:</strong> {formatTime(session.checkInTime)}
                  </p>
                  <p>
                    <strong>Current duration:</strong>{" "}
                    {Math.round((new Date().getTime() - new Date(session.checkInTime).getTime()) / 60000)} minutes
                  </p>
                </div>
              </div>

              <Button onClick={handleCheckOut} className="w-full bg-red-700 hover:bg-red-800" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Check-Out"
                )}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-medium mb-4">How was your volunteer experience today?</h3>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="icon"
                      className={`h-12 w-12 ${rating >= star ? "text-red-700" : "text-gray-300"}`}
                      onClick={() => setRating(star)}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleRatingSubmit} className="w-full bg-red-700 hover:bg-red-800">
                Submit & Finish
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {step === 1
              ? "Please enter the same identifier you used to check in"
              : step === 2
                ? "Thank you for your service today!"
                : "Your feedback helps us improve"}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

