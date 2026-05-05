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
import { useI18n } from "@/i18n/i18n-context";

const INSTRUMENTS = [
  { id: "worship leader", key: "worshipLeader" },
  { id: "drums", key: "drums" },
  { id: "keyboard", key: "keyboard" },
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
  .regex(
    /^\d{10}$/,
    "Phone number must be exactly 10 digits (e.g., 2156678899)"
  )
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
  const { t } = useI18n();
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

  const translateValidationMessage = (message: string) => {
    const map: Record<string, string> = {
      "Name is required": t("musicianRegister.errors.nameRequired"),
      "Name can only contain letters, spaces, hyphens, and apostrophes":
        t("musicianRegister.errors.nameInvalidChars"),
      "Please enter a valid email address":
        t("musicianRegister.errors.invalidEmail"),
      "Phone number must be exactly 10 digits (e.g., 2156678899)":
        t("musicianRegister.errors.invalidPhone"),
      "Field can only contain letters, numbers, spaces, commas, periods, hyphens, and apostrophes":
        t("musicianRegister.errors.invalidTextField"),
    };

    return map[message] || message;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Special handling for phone numbers to strip non-digits and limit to 10 digits
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

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
        t("musicianRegister.errors.nameInvalidChars"),
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

    toast.success(t("musicianRegister.signatureSavedSuccess"));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      // Validate first name using the nameSchema
      nameSchema.parse(formData.firstName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.firstName = translateValidationMessage(error.errors[0].message);
      }
    }

    try {
      // Validate last name using the nameSchema
      nameSchema.parse(formData.lastName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.lastName = translateValidationMessage(error.errors[0].message);
      }
    }

    // Only validate email if provided
    if (formData.email) {
      try {
        emailSchema.parse(formData.email);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.email = translateValidationMessage(error.errors[0].message);
        }
      }
    }

    // Only validate phone if provided
    if (formData.phone) {
      try {
        phoneSchema.parse(formData.phone);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.phone = translateValidationMessage(error.errors[0].message);
        }
      }
    }

    // Require at least email or phone
    if (!formData.email && !formData.phone) {
      newErrors.email = t("musicianRegister.errors.emailOrPhoneRequired");
    }

    // Validate availability
    if (formData.availability) {
      try {
        textFieldSchema.parse(formData.availability);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.availability = translateValidationMessage(error.errors[0].message);
        }
      }
    }

    // Validate instrument selection
    if (formData.instruments.length === 0) {
      newErrors.instruments = t("musicianRegister.errors.instrumentRequired");
    }

    // Validate waiver acceptance
    if (!formData.waiverAccepted) {
      newErrors.waiverAccepted = t("musicianRegister.errors.waiverAcceptRequired");
    }

    // Validate waiver signature
    if (!formData.waiverSignature) {
      newErrors.waiverSignature = t("musicianRegister.errors.waiverSignatureRequired");
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
          toast.error(t("musicianRegister.errors.duplicatePhone"));
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
        toast.success(t("musicianRegister.successTitle"), {
          description: t("musicianRegister.successDescription"),
        });
        router.push(`/musician-dashboard/${musicianId}`);
      } else {
        toast.error(t("musicianRegister.errors.submitFailed"), {
          description: t("musicianRegister.errors.submitFailedDescription"),
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(t("musicianRegister.errors.submitFailed"));
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
                <CardTitle>{t("musicianRegister.title")}</CardTitle>
                <CardDescription>
                  {t("musicianRegister.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {t("musicianRegister.firstName")} <span className="text-red-700">*</span>
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
                    {t("musicianRegister.lastName")} <span className="text-red-700">*</span>
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
                  <Label htmlFor="email">{t("musicianRegister.emailAddress")} <span className="text-red-700">*</span></Label>
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
                  <Label htmlFor="phone">{t("musicianRegister.phoneNumber")} <span className="text-red-700">*</span></Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder={t("musicianRegister.phonePlaceholder")}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {t("musicianRegister.primaryInstrument")} <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={formData.instruments[0] || ""}
                  onValueChange={handleInstrumentChange}
                >
                  <SelectTrigger
                    className={errors.instruments ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={t("musicianRegister.selectInstrument")} />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS.map((instrument) => (
                      <SelectItem key={instrument.id} value={instrument.id}>
                        {t(`musicianRegister.instruments.${instrument.key}`)}
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
                <Label>{t("register.waiver.title")}</Label>
                <div className="max-h-72 overflow-y-auto border rounded-md p-4 text-sm">
                  <p className="font-bold mb-2">
                    {t("register.waiver.heading")}
                  </p>
                  <p className="mb-2">
                    {t("register.waiver.p1")}
                  </p>
                  <p className="mb-2">
                    {t("register.waiver.p2")}
                  </p>
                  <p className="mb-2">
                    {t("register.waiver.p3")}
                  </p>
                  <p className="mb-2">
                    {t("register.waiver.p4")}
                  </p>
                  <p className="mb-2">
                    {t("register.waiver.p5")}
                  </p>
                  <p className="mb-2">
                    {t("register.waiver.p6")}
                  </p>
                  <p className="mb-2">
                    {t("register.waiver.p7")}
                  </p>
                  <p className="mb-2">
                    {t("register.waiver.p8")}
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
                    {t("register.waiver.acceptLabel")}{" "}
                    <span className="text-red-700">*</span>
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
                    saveButtonText={t("register.waiver.saveSignature")}
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
                        <span>{t("musicianRegister.registering")}</span>
                      </>
                    ) : (
                      <>
                        <Music className="h-6 w-6" />
                        <span>{t("musicianRegister.completeRegistration")}</span>
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
