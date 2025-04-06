"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAutoReturn } from "@/hooks/use-auto-return"

export default function CheckIn() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState("")
  const [pin, setPin] = useState("")
  const [program, setProgram] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [volunteerInfo, setVolunteerInfo] = useState<any>(null)

  // Auto-return to home after 60 seconds of inactivity
  useAutoReturn()

  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier) return

    // Check if the volunteer is registered
    const volunteers = JSON.parse(localStorage.getItem("volunteers") || "[]")
    const volunteer = volunteers.find((v: any) => v.email === identifier || v.phone === identifier)

    if (volunteer) {
      setVolunteerInfo(volunteer)
      toast.success(`Welcome back, ${volunteer.firstName}!`)
    }

    setStep(2)
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin) return

    // If volunteer is registered, verify PIN
    if (volunteerInfo && volunteerInfo.pin !== pin) {
      toast.error("Incorrect PIN. Please try again.")
      return
    }

    setStep(3)
  }

  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!program) return

    setIsLoading(true)

    // Simulate API call to check in volunteer
    setTimeout(() => {
      // In a real app, you would save this to a database
      const checkInData = {
        identifier,
        program,
        checkInTime: new Date().toISOString(),
        volunteerInfo: volunteerInfo
          ? {
              id: volunteerInfo.id,
              firstName: volunteerInfo.firstName,
              lastName: volunteerInfo.lastName,
            }
          : null,
      }

      // Store in localStorage for demo purposes
      const activeVolunteers = JSON.parse(localStorage.getItem("activeVolunteers") || "[]")
      activeVolunteers.push(checkInData)
      localStorage.setItem("activeVolunteers", JSON.stringify(activeVolunteers))

      toast.success("Check-in successful!", {
        description: `You've checked in to ${program} at ${new Date().toLocaleTimeString()}`,
      })

      setIsLoading(false)
      router.push("/")
    }, 1000)
  }

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.push("/")
    }
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
              <CardTitle>Volunteer Check-In</CardTitle>
              <CardDescription>Step {step} of 3</CardDescription>
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
                Continue
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handlePinSubmit}>
              <div className="grid gap-4">
                {volunteerInfo && (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">
                      Welcome, {volunteerInfo.firstName} {volunteerInfo.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">Please enter your PIN to continue</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pin">Verification PIN</Label>
                  <Input
                    id="pin"
                    placeholder="Enter your PIN or last 4 digits of phone"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    type="password"
                    maxLength={4}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-6 bg-red-700 hover:bg-red-800">
                Verify
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleProgramSubmit}>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="program">Select Program/Activity</Label>
                  <Select value={program} onValueChange={setProgram}>
                    <SelectTrigger id="program">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meal-service">Meal Service</SelectItem>
                      <SelectItem value="food-pantry">Food Pantry</SelectItem>
                      <SelectItem value="clothing-drive">Clothing Drive</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="outreach">Community Outreach</SelectItem>
                      <SelectItem value="special-events">Special Events</SelectItem>
                      <SelectItem value="fundraising">Fundraising</SelectItem>
                      <SelectItem value="facilities">Facilities Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-6 bg-red-700 hover:bg-red-800"
                disabled={isLoading || !program}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking in...
                  </>
                ) : (
                  "Complete Check-In"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {step < 3 ? "Please complete all steps to check in" : "Thank you for volunteering!"}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

