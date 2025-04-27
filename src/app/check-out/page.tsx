"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

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
import { useAutoReturn } from "@/hooks/use-auto-return";
import {
  getActiveVolunteerSessionByPhoneOrEmail,
  completeVolunteerSession,
} from "@/lib/firebase";

interface VolunteerSession {
  id: string;
  identifier: string;
  program: string;
  checkInTime: string;
  checkOutTime?: string;
  hoursWorked?: string;
  rating?: number;
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

export default function CheckOut() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [session, setSession] = useState<VolunteerSession | null>(null);
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-return to home after 60 seconds of inactivity
  useAutoReturn();

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setIsLoading(true);

    try {
      const result = await getActiveVolunteerSessionByPhoneOrEmail(identifier);

      if (result.success && result.data) {
        setSession(result.data as VolunteerSession);
        setStep(2);
      } else if (result.message === "No active session found") {
        toast.error("No active session found", {
          description:
            "We couldn't find an active check-in with this identifier.",
        });
      } else {
        console.error("Error fetching session:", result.error);
        toast.error("Error finding session", {
          description: "Could not retrieve session details. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error in handleIdentifierSubmit:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!session || !session.id) return;

    setIsLoading(true);

    try {
      const checkOutTime = new Date();
      // Use Timestamps if available for more accuracy, otherwise fallback to ISO string
      const checkIn = session.checkInTimeTimestamp?.toDate
        ? session.checkInTimeTimestamp.toDate()
        : new Date(session.checkInTime);
      const hoursWorked = (
        (checkOutTime.getTime() - checkIn.getTime()) /
        3600000
      ).toFixed(2);

      // Prepare minimal data for the update/completion
      const completedSessionData: { [key: string]: any } = {
        checkOutTime: checkOutTime.toISOString(), // Add check-out ISO string
        hoursWorked: hoursWorked,
        // Conditionally add rating only if it's provided
        ...(rating > 0 && { rating: rating }),
        // checkOutTimeTimestamp will be added server-side by completeVolunteerSession
      };

      // Call the Firebase function to handle completion
      // It needs the ID of the active session and the fields to add/update
      const result = await completeVolunteerSession(
        session.id, // Pass the ID of the active session to delete/move
        completedSessionData // Pass ONLY the new/updated data for the completed session
      );

      if (result.success) {
        setStep(3);
      } else {
        console.error("Error checking out:", result.error);
        toast.error("Check-out failed", {
          description:
          
            "Could not complete the check-out. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error in handleCheckOut:", error);
      toast.error("An unexpected error occurred during check-out.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingSubmit = () => {
    // Rating is now saved during handleCheckOut if provided before step 3
    // If rating step is kept, it just acts as confirmation now.
    toast.success("Check-out Complete!", {
      description:
        rating > 0
          ? "Thank you for your feedback."
          : "Thank you for your service!",
    });
    router.push("/");
  };

  const goBack = () => {
    if (step === 2) {
      setSession(null); // Clear session when going back from step 2
      setIdentifier(""); // Optionally clear identifier
      setStep(1);
    } else {
      router.push("/");
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return "N/A";
    // Check if session and timestamp exist for potentially more accurate time
    if (session?.checkInTimeTimestamp && session.checkInTime === timeString) {
      try {
        return session.checkInTimeTimestamp.toDate().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        /* Fall through */
      }
    }
    // Fallback to ISO string parsing
    try {
      return new Date(timeString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Time";
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
              <CardTitle>Volunteer Check-Out</CardTitle>
              <CardDescription>
                {step === 1
                  ? "Enter your identifier"
                  : step === 2
                  ? "Confirm your session & optionally rate"
                  : "Check-out complete"}
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
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-6 bg-red-700 hover:bg-red-800"
                disabled={isLoading || !identifier}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding...
                  </>
                ) : (
                  "Find My Session"
                )}
              </Button>
            </form>
          )}

          {step === 2 && session && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Active Session</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Volunteer:</strong>{" "}
                    {session.volunteerInfo
                      ? `${session.volunteerInfo.firstName} ${session.volunteerInfo.lastName}`
                      : session.identifier}
                  </p>
                  <p>
                    <strong>Program:</strong>{" "}
                    {session.program
                      ?.replace(/-/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                      "N/A"}
                  </p>
                  <p>
                    <strong>Check-in time:</strong>{" "}
                    {formatTime(session.checkInTime)}
                  </p>
                  <p>
                    <strong>Current duration:</strong>{" "}
                    {Math.round(
                      (new Date().getTime() -
                        (
                          session.checkInTimeTimestamp?.toDate() ||
                          new Date(session.checkInTime)
                        ).getTime()) /
                        60000
                    )}{" "}
                    minutes
                  </p>
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-medium mb-4">
                  Rate your experience (optional)
                </h3>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="icon"
                      className={`h-12 w-12 ${
                        rating >= star ? "text-red-700" : "text-gray-300"
                      }`}
                      onClick={() => setRating(star)}
                      disabled={isLoading}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCheckOut}
                className="w-full bg-red-700 hover:bg-red-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Check-Out...
                  </>
                ) : (
                  "Confirm Check-Out"
                )}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-green-600">
                Check-Out Successful!
              </h3>
              <p>Thank you for volunteering your time.</p>
              {rating > 0 && <p>We appreciate your feedback!</p>}
              <Button
                onClick={handleRatingSubmit}
                className="w-full bg-red-700 hover:bg-red-800"
              >
                Return Home
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {step === 1
              ? "Please enter the same identifier you used to check in"
              : step === 2
              ? "Confirm details and optionally rate your experience"
              : "Have a great day!"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
