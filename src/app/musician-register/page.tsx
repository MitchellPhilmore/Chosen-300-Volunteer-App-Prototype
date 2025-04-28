"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { saveMusician, getMusicianByPhone } from "@/lib/firebase";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignatureMaker } from "@docuseal/signature-maker-react";

const INSTRUMENTS = [
  { id: "worship", label: "Worship" },
  { id: "drums", label: "Drums" },
  { id: "keyboard", label: "Keyboard" },
];

// Define validation schemas
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .regex(
    /^[A-Za-z\s\-']+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  );

const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .or(z.string().length(0));

const phoneSchema = z
  .string()
  .regex(/^\d+$/, "Phone number must contain only digits")
  .or(z.string().length(0));

const textFieldSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9\s\-',\.]+$/,
    "Field can only contain letters, numbers, spaces, commas, periods, hyphens, and apostrophes"
  )
  .or(z.string().length(0));

export default function MusicianRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    instruments: [] as string[],
    experience: "",
    availability: "",
    waiverAccepted: false,
    waiverSignature: null as string | null,
    isSubmitting: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Prevent special characters in name fields
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow letters, spaces, hyphens, apostrophes, and control keys
    const regex = /^[A-Za-z\s\-']$/;
    const isControlKey = e.key.length > 1; // Keys like Backspace, Delete, Arrow keys, etc.

    if (!regex.test(e.key) && !isControlKey) {
      e.preventDefault();
      toast.error(
        "Names can only contain letters, spaces, hyphens, and apostrophes",
        {
          duration: 2000,
          id: "name-validation", // Prevent multiple toasts
        }
      );
    }
  };

  const handleInstrumentChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      instruments: [value], // Only allow one instrument selection
    }));

    // Clear instrument error
    if (errors.instruments) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.instruments;
        return newErrors;
      });
    }
  };

  const handleWaiverChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      waiverAccepted: checked,
    }));

    // Clear waiver error
    if (errors.waiverAccepted) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.waiverAccepted;
        return newErrors;
      });
    }
  };

  const handleWaiverSignatureChange = (signatureData: any) => {
    setFormData((prev) => ({
      ...prev,
      waiverSignature: signatureData.base64,
    }));

    // Clear signature error
    if (errors.waiverSignature) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.waiverSignature;
        return newErrors;
      });
    }

    toast.success("Signature saved successfully!");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      // Validate first name using the nameSchema
      nameSchema.parse(formData.firstName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.firstName = error.errors[0].message;
      }
    }

    try {
      // Validate last name using the nameSchema
      nameSchema.parse(formData.lastName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.lastName = error.errors[0].message;
      }
    }

    // Only validate email if provided
    if (formData.email) {
      try {
        emailSchema.parse(formData.email);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.email = error.errors[0].message;
        }
      }
    }

    // Only validate phone if provided
    if (formData.phone) {
      try {
        phoneSchema.parse(formData.phone);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.phone = error.errors[0].message;
        }
      }
    }

    // Require at least email or phone
    if (!formData.email && !formData.phone) {
      newErrors.email = "Please provide either an email or phone number";
    }

    // Validate availability
    if (formData.availability) {
      try {
        textFieldSchema.parse(formData.availability);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.availability = error.errors[0].message;
        }
      }
    }

    // Validate instrument selection
    if (formData.instruments.length === 0) {
      newErrors.instruments = "Please select at least one instrument you play";
    }

    // Validate waiver acceptance
    if (!formData.waiverAccepted) {
      newErrors.waiverAccepted = "You must accept the waiver to continue";
    }

    // Validate waiver signature
    if (!formData.waiverSignature) {
      newErrors.waiverSignature = "Please sign the waiver to continue";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the form using Zod
    if (!validateForm()) {
      // Show the first error as a toast
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    try {
      // Check if musician already exists in Firebase
      if (formData.phone) {
        // Normalize phone number (remove non-digits)
        const normalizedPhone = formData.phone.replace(/\D/g, "");
        const existingMusician = await getMusicianByPhone(normalizedPhone);

        if (
          existingMusician.success &&
          existingMusician.data &&
          existingMusician.data.length > 0
        ) {
          toast.error("A musician with this phone number already exists");
          return;
        }
      }

      // Generate a unique ID for the musician
      const musicianId = crypto.randomUUID();

      // Create the musician object
      const newMusician = {
        id: musicianId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        instruments: formData.instruments,
        experience: formData.experience,
        availability: formData.availability,
        waiverAccepted: formData.waiverAccepted,
        waiverSignature: formData.waiverSignature,
        registrationDate: new Date().toISOString(),
      };

      // Set loading state during Firebase save
      setFormData((prev) => ({ ...prev, isSubmitting: true }));

      // Save to Firebase
      const result = await saveMusician(newMusician);

      if (result.success) {
        toast.success("Registration successful!", {
          description: "Thank you for registering as a musician.",
        });
        router.push(`/musician-dashboard/${musicianId}`);
      } else {
        toast.error("Failed to register. Please try again.", {
          description: "There was an error saving your information.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to register. Please try again.");
    } finally {
      setFormData((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-2xl mx-auto border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <CardTitle>Musician Registration</CardTitle>
                <CardDescription>
                  Register as a musician with Chosen 300
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    onKeyDown={handleNameKeyDown}
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
                    onKeyDown={handleNameKeyDown}
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
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Primary Instrument <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={formData.instruments[0] || ""}
                  onValueChange={handleInstrumentChange}
                >
                  <SelectTrigger
                    className={errors.instruments ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select your primary instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS.map((instrument) => (
                      <SelectItem key={instrument.id} value={instrument.id}>
                        {instrument.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.instruments && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.instruments}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  placeholder="e.g., Weekends, Wednesday evenings, etc."
                  className={errors.availability ? "border-red-500" : ""}
                />
                {errors.availability && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.availability}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Volunteer Waiver and Release of Liability</Label>
                <div className="max-h-72 overflow-y-auto border rounded-md p-4 text-sm">
                  <p className="font-bold mb-2">
                    CHOSEN 300 VOLUNTEER WAIVER AND RELEASE OF LIABILITY
                  </p>
                  <p className="mb-2">
                    In consideration of my acceptance as a volunteer for
                    activities organized by Chosen 300 (the "Organization"), I,
                    the undersigned volunteer, intending to be legally bound, do
                    hereby waive and forever release any and all rights and
                    claims for damages or injuries that I may have against the
                    Organization, its directors, officers, employees, agents,
                    sponsors, volunteers, and affiliates (collectively, the
                    "Released Parties"), for any and all injuries to me or my
                    personal property. This release includes all injuries and/or
                    damages suffered by me before, during, or after any
                    volunteer activity.
                  </p>
                  <p className="mb-2">
                    I acknowledge that volunteering for community outreach and
                    food distribution is a potentially hazardous activity. I
                    should not participate unless I am medically able to do so
                    and properly trained for the tasks I undertake. I assume all
                    risks associated with volunteering, including but not
                    limited to: slips, trips, falls, contact with other
                    volunteers or members of the public, exposure to weather
                    conditions, transportation-related risks, handling of
                    equipment or food items, and other hazards typically found
                    in volunteer service. I recognize and understand that these
                    risks are inherent and assume full responsibility for any
                    claims which I might have based on any of these risks.
                  </p>
                  <p className="mb-2">
                    I agree to abide by all instructions and decisions of any
                    Organization official regarding my ability to safely perform
                    volunteer duties. I certify that I am physically fit and
                    sufficiently prepared for participation, and that a licensed
                    medical professional has verified my fitness if required by
                    the Organization.
                  </p>
                  <p className="mb-2">
                    In the event of an illness, injury, or medical emergency
                    arising during any volunteer activity, I hereby authorize
                    and consent to the Organization securing from any accredited
                    hospital, clinic, and/or physician any treatment deemed
                    necessary for my immediate care. I agree to be fully
                    responsible for payment of any and all medical services and
                    treatment rendered to me, including but not limited to
                    medical transport, medications, treatment, and
                    hospitalization.
                  </p>
                  <p className="mb-2">
                    I agree to follow any health and safety guidelines issued by
                    the Organization or applicable public health authorities,
                    including but not limited to those related to communicable
                    diseases.
                  </p>
                  <p className="mb-2">
                    I grant permission to the Released Parties to use my name,
                    voice, and likeness in any photographs, video recordings, or
                    other media for promotional, educational, or other
                    legitimate purposes, without compensation or further notice.
                  </p>
                  <p className="mb-2">
                    This volunteer service is provided at no cost. The
                    Organization reserves the right to postpone, modify, or
                    cancel any volunteer activity due to circumstances beyond
                    its control, such as weather events, public health concerns,
                    or safety issues. No compensation or reimbursement will be
                    provided under such circumstances.
                  </p>
                  <p className="mb-2">
                    By signing below, I acknowledge (or, if applicable, my
                    parent or legal guardian acknowledges) that I have read and
                    fully understand this Waiver and Release of Liability, and
                    agree to its terms freely and voluntarily without any
                    inducement.
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox
                    className={`border-red-700 ${
                      errors.waiverAccepted ? "border-red-500" : ""
                    }`}
                    id="waiver-acceptance"
                    checked={formData.waiverAccepted}
                    onCheckedChange={handleWaiverChange}
                  />
                  <Label htmlFor="waiver-acceptance" className="font-medium">
                    I have read and agree to the terms of the Waiver and Release
                    of Liability <span className="text-red-700">*</span>
                  </Label>
                </div>
                {errors.waiverAccepted && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.waiverAccepted}
                  </p>
                )}
                <div
                  className={
                    errors.waiverSignature
                      ? "border-red-500 border rounded-md"
                      : ""
                  }
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

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-red-700 hover:bg-red-800"
                  disabled={formData.isSubmitting}
                >
                  <div className="flex items-center justify-center space-x-3">
                    {formData.isSubmitting ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <Music className="h-6 w-6" />
                        <span>Complete Registration</span>
                        <ChevronRight className="h-5 w-5 opacity-70" />
                      </>
                    )}
                  </div>
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
