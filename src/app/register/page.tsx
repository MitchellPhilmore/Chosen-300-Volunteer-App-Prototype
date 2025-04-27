"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
  saveVolunteer,

  checkDuplicateVolunteer,
} from "@/lib/firebase";
import { z } from "zod";

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
import { Checkbox } from "@/components/ui/checkbox";
import { SignatureMaker } from "@docuseal/signature-maker-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the Zod schema for form validation
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .or(z.string().length(0));
const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^\d+$/, "Phone number must contain only digits")
  .or(z.string().length(0));

// Comprehensive schema for the entire form
const volunteerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: emailSchema,
    phone: phoneSchema,
    volunteerType: z.string(),
    serviceReason: z.string().optional(),
    serviceReasonOther: z.string().optional(),
    serviceInstitution: z.string().optional(),
    site: z.string().min(1, "Please select a preferred site"),
    waiverAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the waiver to continue" }),
    }),
    waiverSignature: z.string().min(1, "You must sign the waiver to continue"),
  })
  .refine(
    (data) => {
      // At least email or phone must be provided
      return data.email.length > 0 || data.phone.length > 0;
    },
    {
      message: "Please provide either an email or phone number",
      path: ["email"],
    }
  )
  .refine(
    (data) => {
      // If volunteer type is community service, must have service reason
      if (data.volunteerType === "communityService") {
        return data.serviceReason && data.serviceReason.length > 0;
      }
      return true;
    },
    {
      message: "Please select a reason for your community service",
      path: ["serviceReason"],
    }
  )
  .refine(
    (data) => {
      // If service reason is "other", must provide detail
      if (
        data.volunteerType === "communityService" &&
        data.serviceReason === "other"
      ) {
        return data.serviceReasonOther && data.serviceReasonOther.length > 0;
      }
      return true;
    },
    {
      message: "Please specify your reason for community service",
      path: ["serviceReasonOther"],
    }
  )
  .refine(
    (data) => {
      // If volunteer type is community service, must have institution
      if (data.volunteerType === "communityService") {
        return data.serviceInstitution && data.serviceInstitution.length > 0;
      }
      return true;
    },
    {
      message: "Please enter the institution requiring your service",
      path: ["serviceInstitution"],
    }
  );

// Create validation functions for each step
function validatePersonalInfo(data: any) {
  const personalInfoSchema = z
    .object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: emailSchema,
      phone: phoneSchema,
      volunteerType: z.string(),
    })
    .refine(
      (data) => {
        // At least email or phone must be provided
        return data.email.length > 0 || data.phone.length > 0;
      },
      {
        message: "Please provide either an email or phone number",
        path: ["email"],
      }
    );

  // Add community service validations if needed
  if (data.volunteerType === "communityService") {
    return z
      .object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: emailSchema,
        phone: phoneSchema,
        volunteerType: z.string(),
        serviceReason: z
          .string()
          .min(1, "Please select a reason for your community service"),
        serviceReasonOther: z.string().optional(),
        serviceInstitution: z
          .string()
          .min(1, "Please enter the institution requiring your service"),
      })
      .refine(
        (data) => {
          // At least email or phone must be provided
          return data.email.length > 0 || data.phone.length > 0;
        },
        {
          message: "Please provide either an email or phone number",
          path: ["email"],
        }
      )
      .refine(
        (data) => {
          // If service reason is "other", must provide detail
          if (data.serviceReason === "other") {
            return (
              data.serviceReasonOther && data.serviceReasonOther.length > 0
            );
          }
          return true;
        },
        {
          message: "Please specify your reason for community service",
          path: ["serviceReasonOther"],
        }
      )
      .parse(data);
  }

  return personalInfoSchema.parse(data);
}

function validateSiteSelection(data: any) {
  return z
    .object({
      site: z.string().min(1, "Please select a preferred site"),
    })
    .parse(data);
}

function validateWaiver(data: any) {
  return z
    .object({
      waiverAccepted: z.literal(true, {
        errorMap: () => ({ message: "You must accept the waiver to continue" }),
      }),
      waiverSignature: z
        .string()
        .min(1, "You must sign the waiver to continue"),
    })
    .parse(data);
}

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3; // Reduced from 4 to 3 (no emergency contact)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Simplified form state
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
      serviceReason: "",
      serviceReasonOther: "", // New field for custom "other" reason
      serviceInstitution: "",
      site: "", // New field for site selection
      waiverAccepted: false,
      waiverSignature: "",
    };
  });

  // Effect to handle initial step based on type (if provided)
  useEffect(() => {
    const type = searchParams.get("type");
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
  }, [searchParams, step]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for the field being changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleVolunteerTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      volunteerType: value,
    }));
  };

  // Handle site selection
  const handleSiteChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      site: value,
    }));

    // Clear site error when changed
    if (errors.site) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.site;
        return newErrors;
      });
    }
  };

  // Handle waiver acceptance
  const handleWaiverChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      waiverAccepted: checked,
    }));

    // Clear waiver error when changed
    if (errors.waiverAccepted) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.waiverAccepted;
        return newErrors;
      });
    }
  };

  const [signatureSaved, setSignatureSaved] = useState(false);

  const handleWaiverSignatureChange = (data: any) => {
    console.log("Signature data received:", data.base64);
    // Only update if we received actual data (not empty)
    if (data && data !== "") {
      setFormData((prev) => ({
        ...prev,
        waiverSignature: data.base64,
      }));
      setSignatureSaved(true);
      toast.success("Signature saved successfully");

      // Clear signature error when changed
      if (errors.waiverSignature) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.waiverSignature;
          return newErrors;
        });
      }
    }
  };

  // Handle service reason dropdown change
  const handleServiceReasonChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceReason: value,
      // Reset the "other" reason if not selecting "other"
      serviceReasonOther: value !== "other" ? "" : prev.serviceReasonOther,
    }));

    // Clear service reason error when changed
    if (errors.serviceReason) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.serviceReason;
        return newErrors;
      });
    }
  };

  // Form validation for each step using Zod
  const validateStep = () => {
    try {
      if (step === 1) {
        // Validate personal information
        validatePersonalInfo(formData);
      } else if (step === 2) {
        // Validate site selection
        validateSiteSelection(formData);
      } else if (step === 3) {
        // Validate waiver
        validateWaiver(formData);
      }

      // Clear errors if validation passes
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Transform Zod errors into a more usable format
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          // Get the field name from the path
          const fieldName = err.path.join(".");
          errorMap[fieldName] = err.message;
        });

        // Set the errors
        setErrors(errorMap);

        // Show the first error as a toast
        if (error.errors.length > 0) {
          toast.error(error.errors[0].message);
        }
      } else {
        // Handle unexpected errors
        console.error("Validation error:", error);
        toast.error("An error occurred during validation");
      }
      return false;
    }
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the entire form
    try {
      volunteerSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Transform Zod errors into a more usable format
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          const fieldName = err.path.join(".");
          errorMap[fieldName] = err.message;
        });

        // Set the errors
        setErrors(errorMap);

        // Show the first error as a toast
        if (error.errors.length > 0) {
          toast.error(error.errors[0].message);
        }
        return;
      }
    }

    setIsLoading(true);

    try {
      // Check for duplicate volunteer
      const { isDuplicate, message } = await checkDuplicateVolunteer(
        formData.email,
        formData.phone
      );

      if (isDuplicate) {
        setErrors({
          ...errors,
          duplicate: message || "This volunteer already exists in our system.",
        });
        setIsLoading(false);
        toast.error("Registration failed. " + message);
        return;
      }

      // Create a unique ID for the volunteer
      const volunteerId = uuidv4();

      const newVolunteer = {
        id: volunteerId,
        ...formData,
        registrationDate: new Date().toISOString(),
      };

      // Save to Firestore
      const result = await saveVolunteer(newVolunteer);

      if (result.success) {
        toast.success("Registration successful!", {
          description: "Thank you for registering as a volunteer.",
        });

        // Also save to localStorage as a backup
        const volunteers = JSON.parse(
          localStorage.getItem("volunteers") || "[]"
        );
        volunteers.push(newVolunteer);
        localStorage.setItem("volunteers", JSON.stringify(volunteers));

        router.push(`/volunteer-dashboard/${volunteerId}`);
      } else {
        toast.error("Registration failed", {
          description: "Please try again or contact support.",
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error("Registration failed", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
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
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.firstName}
                    </p>
                  )}
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
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastName}
                    </p>
                  )}
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
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {formData.volunteerType === "communityService" && (
                <div className="space-y-4 border-t pt-4 mt-4">
                  <h4 className="font-medium">Community Service Information</h4>

                  <div className="space-y-2">
                    <Label htmlFor="serviceReason">
                      Reason for Service <span className="text-red-700">*</span>
                    </Label>
                    <Select
                      value={formData.serviceReason}
                      onValueChange={handleServiceReasonChange}
                    >
                      <SelectTrigger
                        id="serviceReason"
                        className={`w-full ${
                          errors.serviceReason ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="court-ordered">
                          Court ordered
                        </SelectItem>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.serviceReason && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.serviceReason}
                      </p>
                    )}

                    {formData.serviceReason === "other" && (
                      <div className="mt-2">
                        <Input
                          id="serviceReasonOther"
                          name="serviceReasonOther"
                          value={formData.serviceReasonOther}
                          onChange={handleChange}
                          placeholder="Please specify your reason"
                          className={`mt-1 ${
                            errors.serviceReasonOther ? "border-red-500" : ""
                          }`}
                          required
                        />
                        {errors.serviceReasonOther && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.serviceReasonOther}
                          </p>
                        )}
                      </div>
                    )}
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
                      className={
                        errors.serviceInstitution ? "border-red-500" : ""
                      }
                    />
                    {errors.serviceInstitution && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.serviceInstitution}
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                  className="w-full bg-red-700 hover:bg-red-800 h-auto whitespace-normal py-3 text-center"
                >
                  Continue to Site Selection
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
              <h3 className="text-lg font-medium">
                Select Your Preferred Site
              </h3>

              <div className="space-y-4">
                <RadioGroup
                  value={formData.site}
                  onValueChange={handleSiteChange}
                  className="space-y-4"
                >
                  <div
                    className={`flex items-center space-x-2 border p-4 rounded-md ${
                      errors.site ? "border-red-500" : ""
                    }`}
                  >
                    <RadioGroupItem
                      value="west-philadelphia"
                      id="west-philadelphia"
                    />
                    <Label
                      htmlFor="west-philadelphia"
                      className="font-medium cursor-pointer"
                    >
                      West Philadelphia
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-2 border p-4 rounded-md ${
                      errors.site ? "border-red-500" : ""
                    }`}
                  >
                    <RadioGroupItem value="spring-garden" id="spring-garden" />
                    <Label
                      htmlFor="spring-garden"
                      className="font-medium cursor-pointer"
                    >
                      Spring Garden
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-2 border p-4 rounded-md ${
                      errors.site ? "border-red-500" : ""
                    }`}
                  >
                    <RadioGroupItem value="ambler" id="ambler" />
                    <Label
                      htmlFor="ambler"
                      className="font-medium cursor-pointer"
                    >
                      Ambler
                    </Label>
                  </div>
                </RadioGroup>
                {errors.site && (
                  <p className="text-red-500 text-xs mt-1">{errors.site}</p>
                )}
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

      case 3:
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
                className={`border-red-700 ${
                  errors.waiverAccepted ? "border-red-500" : ""
                }`}
                id="waiver-acceptance"
                checked={formData.waiverAccepted}
                onCheckedChange={handleWaiverChange}
              />
              <Label htmlFor="waiver-acceptance" className="font-medium">
                I have read and agree to the terms of the Waiver and Release of
                Liability
              </Label>
            </div>
            {errors.waiverAccepted && (
              <p className="text-red-500 text-xs mt-1">
                {errors.waiverAccepted}
              </p>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signature" className="font-medium">
                  Please sign below
                </Label>
                {signatureSaved && (
                  <span className="text-green-600 text-sm">
                    ✓ Signature saved
                  </span>
                )}
              </div>

              <div
                className={`border rounded-md p-4 ${
                  errors.waiverSignature ? "border-red-500" : ""
                }`}
              >
                <SignatureMaker
                  downloadOnSave={false}
                  onSave={handleWaiverSignatureChange}
                  saveButtonText="Save Signature"
                  saveButtonClass="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md"
                  canvasClass="h-50 w-full"
                  withColorSelect={false}
                  withUpload={false}
                  withTyped={false}
                  textTypeButtonClass="hidden"
                />
              </div>
              {errors.waiverSignature && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.waiverSignature}
                </p>
              )}
            </div>

            {!signatureSaved && (
              <p className="text-amber-600 text-sm">
                Please sign and click "Save Signature" before continuing
              </p>
            )}

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
                Site Selection
              </span>
              <span className={step >= 3 ? "text-red-700 font-medium" : ""}>
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
