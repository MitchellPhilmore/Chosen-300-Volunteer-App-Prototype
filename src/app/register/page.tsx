"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, User, Briefcase } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form state - Initialize with potential pre-fill values
  const [formData, setFormData] = useState(() => {
    // Get initial values from query parameters only on initial load
    const initialFirstName = searchParams.get("firstName") || "";
    const initialLastName = searchParams.get("lastName") || "";
    const initialEmail = searchParams.get("email") || "";
    const initialPhone = searchParams.get("phone") || "";
    const initialType =
      searchParams.get("type") === "communityService" ? "communityService" : "";

    return {
      volunteerType: initialType,
      firstName: initialFirstName,
      lastName: initialLastName,
      email: initialEmail,
      phone: initialPhone,
      address: "",
      city: "",
      state: "",
      zip: "",
      emergencyName: "",
      emergencyPhone: "",
      skills: "",
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
      waiverAccepted: false,
    };
  });

  // Effect to handle initial step based on type (if provided)
  useEffect(() => {
    const type = searchParams.get("type");
    // Also check if source=musicianDashboard to prevent infinite loop if user navigates back
    const source = searchParams.get("source");

    if (
      type === "communityService" &&
      source === "musicianDashboard" &&
      step !== 1
    ) {
      // Already handled by useState initializer, do nothing if type is set
    } else if (type === "communityService" && step === 1) {
      // If type is set but somehow we are on step 1 (e.g., direct navigation), update state
      setFormData((prev) => ({ ...prev, volunteerType: "communityService" }));
    } else if (!type && source !== "musicianDashboard") {
      // If navigated without type (regular volunteer), ensure type is regular
      setFormData((prev) => ({ ...prev, volunteerType: "regular" }));
    }

    // We don't automatically advance the step here anymore,
    // the pre-filled fields will just be there when step 1 loads.
  }, [searchParams, step]); // Added step dependency

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

  const handleVolunteerTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      volunteerType: value,
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

  // Handle waiver acceptance
  const handleWaiverChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      waiverAccepted: checked,
    }));
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
    } else if (step === 4) {
      // Validate waiver acceptance
      if (!formData.waiverAccepted) {
        toast.error("You must accept the waiver to continue");
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
      const volunteerId = crypto.randomUUID();

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

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className="w-1/2 border-gray-400 text-gray-600 hover:bg-gray-100"
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
                  Continue to Emergency Contact
                </Button>
              </motion.div>
            </div>
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
                className="w-1/2 border-gray-400 text-gray-600 hover:bg-gray-100"
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
                className="w-1/2 border-gray-400 text-gray-600 hover:bg-gray-100"
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
                  Continue to Waiver
                </Button>
              </motion.div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-medium">
              Volunteer Waiver and Release of Liability
            </h3>
            <div className="max-h-72 overflow-y-auto border rounded-md p-4 text-sm">
              <p className="font-bold mb-2">
                CHOSEN 300 VOLUNTEER WAIVER AND RELEASE OF LIABILITY
              </p>
              <p className="mb-2">
                In consideration of my acceptance as a volunteer for activities
                organized by Chosen 300 (the "Organization"), I, the undersigned
                volunteer, intending to be legally bound, do hereby waive and
                forever release any and all rights and claims for damages or
                injuries that I may have against the Organization, its
                directors, officers, employees, agents, sponsors, volunteers,
                and affiliates (collectively, the "Released Parties"), for any
                and all injuries to me or my personal property. This release
                includes all injuries and/or damages suffered by me before,
                during, or after any volunteer activity.
              </p>
              <p className="mb-2">
                I acknowledge that volunteering for community outreach and food
                distribution is a potentially hazardous activity. I should not
                participate unless I am medically able to do so and properly
                trained for the tasks I undertake. I assume all risks associated
                with volunteering, including but not limited to: slips, trips,
                falls, contact with other volunteers or members of the public,
                exposure to weather conditions, transportation-related risks,
                handling of equipment or food items, and other hazards typically
                found in volunteer service. I recognize and understand that
                these risks are inherent and assume full responsibility for any
                claims which I might have based on any of these risks.
              </p>
              <p className="mb-2">
                I agree to abide by all instructions and decisions of any
                Organization official regarding my ability to safely perform
                volunteer duties. I certify that I am physically fit and
                sufficiently prepared for participation, and that a licensed
                medical professional has verified my fitness if required by the
                Organization.
              </p>
              <p className="mb-2">
                In the event of an illness, injury, or medical emergency arising
                during any volunteer activity, I hereby authorize and consent to
                the Organization securing from any accredited hospital, clinic,
                and/or physician any treatment deemed necessary for my immediate
                care. I agree to be fully responsible for payment of any and all
                medical services and treatment rendered to me, including but not
                limited to medical transport, medications, treatment, and
                hospitalization.
              </p>
              <p className="mb-2">
                I agree to follow any health and safety guidelines issued by the
                Organization or applicable public health authorities, including
                but not limited to those related to communicable diseases.
              </p>
              <p className="mb-2">
                I grant permission to the Released Parties to use my name,
                voice, and likeness in any photographs, video recordings, or
                other media for promotional, educational, or other legitimate
                purposes, without compensation or further notice.
              </p>
              <p className="mb-2">
                This volunteer service is provided at no cost. The Organization
                reserves the right to postpone, modify, or cancel any volunteer
                activity due to circumstances beyond its control, such as
                weather events, public health concerns, or safety issues. No
                compensation or reimbursement will be provided under such
                circumstances.
              </p>
              <p className="mb-2">
                By signing below, I acknowledge (or, if applicable, my parent or
                legal guardian acknowledges) that I have read and fully
                understand this Waiver and Release of Liability, and agree to
                its terms freely and voluntarily without any inducement.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="waiver-acceptance"
                checked={formData.waiverAccepted}
                onCheckedChange={handleWaiverChange}
              />
              <Label htmlFor="waiver-acceptance" className="font-medium">
                I have read and agree to the terms of the Waiver and Release of
                Liability
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Back
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
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
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1 mt-1">
              <span className={step >= 1 ? "text-red-700 font-medium" : ""}>
                Personal Info
              </span>
              <span className={step >= 2 ? "text-red-700 font-medium" : ""}>
                Emergency Contact
              </span>
              <span className={step >= 3 ? "text-red-700 font-medium" : ""}>
                Preferences
              </span>
              <span className={step >= 4 ? "text-red-700 font-medium" : ""}>
                Waiver
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
