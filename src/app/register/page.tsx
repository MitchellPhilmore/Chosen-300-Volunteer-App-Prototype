"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    emergencyName: "",
    emergencyPhone: "",
    skills: "",
    volunteerType: "",
    serviceReason: "",
    serviceInstitution: "",
    availability: {
      weekdayMorning: false,
      weekdayAfternoon: false,
      weekdayEvening: false,
      weekendMorning: false,
      weekendAfternoon: false,
      weekendEvening: false,
    },
    interests: [] as string[],
  });

  // Load volunteer type from localStorage if it exists
  useEffect(() => {
    const savedType = localStorage.getItem("volunteerType");
    if (savedType) {
      setFormData((prev) => ({
        ...prev,
        volunteerType: savedType,
      }));
    } else {
      // If no type is saved, redirect to type selection
      router.push("/volunteer-type");
    }
  }, [router]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle checkbox changes for availability
  const handleAvailabilityChange = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: !prev.availability[key as keyof typeof prev.availability],
      },
    }));
  };

  // Handle interest selection
  const handleInterestChange = (interest: string) => {
    setFormData((prev) => {
      const currentInterests = [...prev.interests];
      if (currentInterests.includes(interest)) {
        return {
          ...prev,
          interests: currentInterests.filter((i) => i !== interest),
        };
      } else {
        return {
          ...prev,
          interests: [...currentInterests, interest],
        };
      }
    });
  };

  // Form validation for each step
  const validateStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName) {
        toast.error("Please enter your full name");
        return false;
      }

      if (!formData.email && !formData.phone) {
        toast.error("Please provide either an email or phone number");
        return false;
      }

      if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }

      if (formData.volunteerType === "communityService") {
        if (!formData.serviceReason) {
          toast.error("Please enter the reason for your community service");
          return false;
        }
        if (!formData.serviceInstitution) {
          toast.error("Please enter the institution requiring your service");
          return false;
        }
      }
    } else if (step === 2) {
      if (!formData.emergencyName || !formData.emergencyPhone) {
        toast.error("Please provide emergency contact information");
        return false;
      }
    } else if (step === 3) {
      // Validate availability
      const hasAvailability = Object.values(formData.availability).some(
        Boolean
      );
      if (!hasAvailability) {
        toast.error("Please select at least one availability time slot");
        return false;
      }

      // Validate interests
      if (formData.interests.length === 0) {
        toast.error("Please select at least one area of interest");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep()) return;

    setIsLoading(true);

    // In a real app, this would be an API call to register the volunteer
    setTimeout(() => {
      // Store volunteer data in localStorage
      const volunteers = JSON.parse(localStorage.getItem("volunteers") || "[]");

      // Create a unique ID for the volunteer
      const volunteerId = `vol-${Date.now()}`;

      const newVolunteer = {
        id: volunteerId,
        ...formData,
        registrationDate: new Date().toISOString(),
      };

      volunteers.push(newVolunteer);
      localStorage.setItem("volunteers", JSON.stringify(volunteers));

      toast.success("Registration successful!", {
        description: "Thank you for registering as a volunteer.",
      });

      setIsLoading(false);
      router.push(`/volunteer-dashboard/${volunteerId}`);
    }, 1500);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {formData.volunteerType === "communityService" && (
                <div className="space-y-4 border-t pt-4 mt-4">
                  <h4 className="font-medium">Community Service Information</h4>

                  <div className="space-y-2">
                    <Label htmlFor="serviceReason">
                      Reason for Service <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="serviceReason"
                      name="serviceReason"
                      value={formData.serviceReason}
                      onChange={handleChange}
                      placeholder="e.g., Court ordered, School requirement"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceInstitution">
                      Assigning Institution{" "}
                      <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="serviceInstitution"
                      name="serviceInstitution"
                      value={formData.serviceInstitution}
                      onChange={handleChange}
                      placeholder="e.g., Philadelphia Municipal Court, Central High School"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={nextStep}
                className="w-full bg-red-700 hover:bg-red-800"
              >
                Continue to Emergency Contact
              </Button>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contact</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">
                    Contact Name <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="emergencyName"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">
                    Contact Phone <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="w-1/2 border-red-700 text-red-700 hover:bg-red-50"
              >
                Back
              </Button>

              <motion.div
                className="w-1/2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-red-700 hover:bg-red-800"
                >
                  Continue to Preferences
                </Button>
              </motion.div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Volunteer Preferences</h3>

              <div className="space-y-4">
                <Label>Areas of Interest</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Meal Service",
                    "Food Pantry",
                    "Clothing Distribution",
                    "Administrative",
                    "Community Outreach",
                    "Special Events",
                    "Fundraising",
                    "Facilities Maintenance",
                  ].map((interest) => (
                    <div key={interest} className="flex items-center space-x-3">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={() => handleInterestChange(interest)}
                        className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:border-red-800"
                      />
                      <label
                        htmlFor={`interest-${interest}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {interest}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Availability</Label>
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-6">
                    {/* Header Row */}
                    <div className="col-start-2 col-span-3 grid grid-cols-3 gap-4">
                      <div className="text-center text-sm font-medium text-gray-600">
                        Morning
                      </div>
                      <div className="text-center text-sm font-medium text-gray-600">
                        Afternoon
                      </div>
                      <div className="text-center text-sm font-medium text-gray-600">
                        Evening
                      </div>
                    </div>

                    {/* Weekday Row */}
                    <div className="text-sm font-medium text-gray-700">
                      Weekdays
                    </div>
                    <div className="col-span-3 grid grid-cols-3 gap-4">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={formData.availability.weekdayMorning}
                          onCheckedChange={() =>
                            handleAvailabilityChange("weekdayMorning")
                          }
                          className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:border-red-800"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={formData.availability.weekdayAfternoon}
                          onCheckedChange={() =>
                            handleAvailabilityChange("weekdayAfternoon")
                          }
                          className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:border-red-800"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={formData.availability.weekdayEvening}
                          onCheckedChange={() =>
                            handleAvailabilityChange("weekdayEvening")
                          }
                          className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:border-red-800"
                        />
                      </div>
                    </div>

                    {/* Weekend Row */}
                    <div className="text-sm font-medium text-gray-700">
                      Weekends
                    </div>
                    <div className="col-span-3 grid grid-cols-3 gap-4">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={formData.availability.weekendMorning}
                          onCheckedChange={() =>
                            handleAvailabilityChange("weekendMorning")
                          }
                          className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:border-red-800"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={formData.availability.weekendAfternoon}
                          onCheckedChange={() =>
                            handleAvailabilityChange("weekendAfternoon")
                          }
                          className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:border-red-800"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={formData.availability.weekendEvening}
                          onCheckedChange={() =>
                            handleAvailabilityChange("weekendEvening")
                          }
                          className="border-gray-500 data-[state=checked]:bg-red-800 data-[state=checked]:border-red-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills & Experience</Label>
                <Textarea
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="Please share any relevant skills or experience you have"
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="w-1/2 border-red-700 text-red-700 hover:bg-red-50"
              >
                Back
              </Button>

              <motion.div
                className="w-1/2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-red-700 hover:bg-red-800"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-3xl mx-auto border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <CardTitle>Volunteer Registration</CardTitle>
                <CardDescription>
                  Register as a new volunteer with Chosen 300
                </CardDescription>
              </div>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
              <div
                className="bg-red-700 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span className={step >= 1 ? "text-red-700 font-medium" : ""}>
                Personal Info
              </span>
              <span className={step >= 2 ? "text-red-700 font-medium" : ""}>
                Emergency Contact
              </span>
              <span className={step >= 3 ? "text-red-700 font-medium" : ""}>
                Preferences
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>{renderStepContent()}</form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Thank you for your interest in volunteering with Chosen 300!
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
