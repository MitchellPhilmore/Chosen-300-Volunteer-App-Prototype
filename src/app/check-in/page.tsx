"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAutoReturn } from "@/hooks/use-auto-return";

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  pin?: string;
}

interface CheckInData {
  identifier: string;
  checkInTime: string;
  volunteerInfo: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function CheckIn() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [dailyCode, setDailyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [volunteerInfo, setVolunteerInfo] = useState<Volunteer | null>(null);

  // Auto-return to home after 60 seconds of inactivity
  useAutoReturn();

  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    // Check if the volunteer is registered
    const volunteers = JSON.parse(localStorage.getItem("volunteers") || "[]");
    const volunteer = volunteers.find(
      (v: Volunteer) => v.email === identifier || v.phone === identifier
    );

    if (volunteer) {
      setVolunteerInfo(volunteer);
      toast.success(`Welcome back, ${volunteer.firstName}!`);
    }

    setStep(2);
  };

  const handleDailyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyCode) return;

    // Validate daily code
    const savedCode = localStorage.getItem("dailyCode");
    if (!savedCode) {
      toast.error("No active check-in code", {
        description: "Please check with your coordinator.",
      });
      return;
    }

    const activeCode = JSON.parse(savedCode);

    // Check if code has expired
    if (new Date(activeCode.expiresAt) <= new Date()) {
      toast.error("Check-in code has expired", {
        description: "Please check with your coordinator for today's code.",
      });
      setDailyCode(""); // Clear the input
      return;
    }

    // Ensure both codes are padded to 4 digits for comparison
    const submittedCode = dailyCode.padStart(4, "0");
    const storedCode = activeCode.code.padStart(4, "0");

    if (submittedCode !== storedCode) {
      toast.error("Invalid check-in code", {
        description: "Please check with your coordinator for the correct code.",
      });
      setDailyCode(""); // Clear the input on invalid code
      return;
    }

    // Code is valid, proceed with check-in
    setIsLoading(true);

    // Simulate API call to check in volunteer
    setTimeout(() => {
      // In a real app, you would save this to a database
      const checkInData: CheckInData = {
        identifier,
        checkInTime: new Date().toISOString(),
        volunteerInfo: volunteerInfo
          ? {
              id: volunteerInfo.id,
              firstName: volunteerInfo.firstName,
              lastName: volunteerInfo.lastName,
            }
          : null,
      };

      // Store in localStorage for demo purposes
      const activeVolunteers = JSON.parse(
        localStorage.getItem("activeVolunteers") || "[]"
      );
      activeVolunteers.push(checkInData);
      localStorage.setItem(
        "activeVolunteers",
        JSON.stringify(activeVolunteers)
      );

      toast.success("Check-in successful!", {
        description: `You've checked in at ${new Date().toLocaleTimeString()}`,
      });

      setIsLoading(false);
      router.push("/");
    }, 1000);
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Volunteer Check-In</CardTitle>
              <CardDescription>Step {step} of 2</CardDescription>
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
              <Button
                type="submit"
                className="w-full mt-6 bg-red-700 hover:bg-red-800"
              >
                Continue
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleDailyCodeSubmit}>
              <div className="grid gap-4">
                {volunteerInfo && (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">
                      Welcome, {volunteerInfo.firstName}{" "}
                      {volunteerInfo.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please enter today's check-in code
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="dailyCode">Check-in Code</Label>
                  <Input
                    id="dailyCode"
                    placeholder="Enter 4-digit code"
                    value={dailyCode}
                    onChange={(e) =>
                      setDailyCode(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    type="text"
                    maxLength={4}
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-6 bg-red-700 hover:bg-red-800"
                disabled={dailyCode.length !== 4 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking in...
                  </>
                ) : (
                  "Complete Check-in"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {step === 1
              ? "Please enter your identifier to begin"
              : "Enter the code provided by your coordinator"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
