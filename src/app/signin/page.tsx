"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignIn() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [volunteerInfo, setVolunteerInfo] = useState<any>(null)

  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier) return

    setIsLoading(true)

    // Check if the volunteer is registered
    setTimeout(() => {
      const volunteers = JSON.parse(localStorage.getItem("volunteers") || "[]")
      const volunteer = volunteers.find((v: any) => v.email === identifier || v.phone === identifier)

      if (volunteer) {
        setVolunteerInfo(volunteer)
        toast.success(`Welcome back, ${volunteer.firstName}!`)

        // Redirect to the volunteer dashboard
        setTimeout(() => {
          router.push(`/volunteer-dashboard/${volunteer.id}`)
        }, 1000)
      } else {
        toast.error("Volunteer not found", {
          description: "Please check your email/phone or register as a new volunteer.",
        })
        setIsLoading(false)
      }
    }, 800)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <CardTitle>Volunteer Sign In</CardTitle>
                <CardDescription>Sign in with your email or phone number</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIdentifierSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Phone Number</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="identifier"
                    placeholder="Enter your email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full bg-red-700 hover:bg-red-800"
                  disabled={isLoading || !identifier}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 items-center border-t pt-4">
            <p className="text-sm text-muted-foreground">Don't have an account yet?</p>
            <Link href="/register" className="w-full">
              <Button variant="outline" className="w-full border-red-700 text-red-700 hover:bg-red-50">
                Register as New Volunteer
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

