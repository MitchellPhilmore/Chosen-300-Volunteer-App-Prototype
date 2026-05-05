"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { saveVolunteer, checkDuplicateVolunteer } from "@/lib/firebase";
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
import { useI18n } from "@/i18n/i18n-context";

// Define the Zod schema for form validation
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

// Name validation - allow letters, spaces, hyphens, and apostrophes
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .regex(
    /^[A-Za-z\s\-']+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  );

// Text field validation - more permissive but still restricts special characters
const textFieldSchema = z
  .string()
  .regex(/^[A-Za-z0-9\s\-',\.()\/&]+$/, "Field contains invalid characters");

// Comprehensive schema for the entire form
const volunteerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema.refine((value) => value.length > 0, {
      message: "Email address is required",
    }),
    phone: phoneSchema.refine((value) => value.length > 0, {
      message: "Phone number is required",
    }),
    volunteerType: z.enum(["communityService", "employment"]),
    serviceReason: z.string().optional(),
    serviceReasonOther: textFieldSchema.optional(),
    serviceInstitution: textFieldSchema.optional(),
    site: z.string().min(1, "Please select a preferred site"),
    waiverAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the waiver to continue" }),
    }),
    waiverSignature: z.string().min(1, "You must sign the waiver to continue"),
  })
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
function validatePersonalInfo(data: any, isSpecialized: boolean) {
  // For regular volunteers, create a simpler schema
  if (!isSpecialized) {
    const regularVolunteerSchema = z.object({
      firstName: nameSchema,
      lastName: nameSchema,
      email: emailSchema.refine((value) => value.length > 0, {
        message: "Email address is required",
      }),
      phone: phoneSchema.refine((value) => value.length > 0, {
        message: "Phone number is required",
      }),
    });

    return regularVolunteerSchema.parse(data);
  }

  // For specialized volunteers, use the more complex schema
  // Base schema for all volunteers
  const baseSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema.refine((value) => value.length > 0, {
      message: "Email address is required",
    }),
    phone: phoneSchema.refine((value) => value.length > 0, {
      message: "Phone number is required",
    }),
    volunteerType: z.enum(["communityService", "employment"], {
      errorMap: () => ({
        message: "Please select a registration type (Community Service or Employee)",
      }),
    }),
  });

  // Validate base schema first
  const baseResult = baseSchema.safeParse(data);
  if (!baseResult.success) {
    // Transform the error to be more user-friendly for volunteerType
    const formattedErrors = baseResult.error.errors.map((err) => {
      if (err.path.includes("volunteerType")) {
        return {
          ...err,
          message: "Please select a registration type (Community Service or Employee)",
        };
      }
      return err;
    });
    throw new z.ZodError(formattedErrors);
  }

  // If community service, add specific validations
  if (data.volunteerType === "communityService") {
    const communityServiceSchema = z
      .object({
        serviceReason: z
          .string()
          .min(1, "Please select a reason for your community service"),
        serviceReasonOther: z.string().optional(),
        serviceInstitution: z
          .string()
          .min(1, "Please enter the institution requiring your service"),
      })
      .refine(
        (csData) => {
          if (csData.serviceReason === "other") {
            return (
              csData.serviceReasonOther && csData.serviceReasonOther.length > 0
            );
          }
          return true;
        },
        {
          message: "Please specify your reason for community service",
          path: ["serviceReasonOther"],
        }
      );

    const csResult = communityServiceSchema.safeParse(data);
    if (!csResult.success) {
      throw csResult.error;
    }

    if (data.serviceReason === "other" && data.serviceReasonOther) {
      const reasonOtherResult = textFieldSchema.safeParse(
        data.serviceReasonOther
      );
      if (!reasonOtherResult.success) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: ["serviceReasonOther"],
            message: "Reason contains invalid characters",
          },
        ]);
      }
    }

    if (data.serviceInstitution) {
      const institutionResult = textFieldSchema.safeParse(
        data.serviceInstitution
      );
      if (!institutionResult.success) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: ["serviceInstitution"],
            message: "Institution name contains invalid characters",
          },
        ]);
      }
    }
  }

  return baseResult.data;
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
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3; // Reduced from 4 to 3 (no emergency contact)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if this is a specialized registration (community service or employment)
  const [isSpecializedRegistration, setIsSpecializedRegistration] =
    useState(false);

  // Simplified form state
  const [formData, setFormData] = useState(() => {
    // Get initial values from query parameters only on initial load
    const initialFirstName = searchParams.get("firstName") || "";
    const initialLastName = searchParams.get("lastName") || "";
    const initialEmail = searchParams.get("email") || "";
    const initialPhone = searchParams.get("phone") || "";
    const initialType = searchParams.get("type") || "communityService"; // Default to community service

    // Check if this is a specialized registration from query params
    const isSpecialized = searchParams.has("type");
    setIsSpecializedRegistration(isSpecialized);

    return {
      volunteerType: initialType,
      firstName: initialFirstName,
      lastName: initialLastName,
      email: initialEmail,
      phone: initialPhone,
      serviceReason: "",
      serviceReasonOther: "",
      serviceInstitution: "",
      site: "",
      waiverAccepted: false,
      waiverSignature: "",
    };
  });

  // Effect to handle initial step based on type (if provided)
  useEffect(() => {
    const type = searchParams.get("type");
    const source = searchParams.get("source");

    // Handle specialized registration (community service/employment)
    if (type === "specialized") {
      setIsSpecializedRegistration(true);
      // Default to communityService if no specific type given
      setFormData((prev) => ({
        ...prev,
        volunteerType: prev.volunteerType || "communityService",
      }));
    }
    // Handle legacy type param values for backward compatibility
    else if (
      type === "communityService" &&
      source === "musicianDashboard" &&
      step !== 1
    ) {
      // Already handled by useState initializer, do nothing if type is set
    } else if (type === "communityService" && step === 1) {
      // If type is communityService, mark as specialized and set type
      setIsSpecializedRegistration(true);
      setFormData((prev) => ({ ...prev, volunteerType: "communityService" }));
    } else if (!type && source !== "musicianDashboard") {
      // Regular volunteer registration (no specialized fields)
      setIsSpecializedRegistration(false);
      setFormData((prev) => ({ ...prev, volunteerType: "regular" }));
    }
  }, [searchParams, step]);

  // Handle form input changes
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
      toast.error(t("register.errors.nameInvalidChars"), {
        duration: 2000,
        id: "name-validation", // Prevent multiple toasts
      });
    }
  };

  const handleVolunteerTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      volunteerType: value,
    }));

    // Clear volunteerType error when changed
    if (errors.volunteerType) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.volunteerType;
        return newErrors;
      });
    }
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
      toast.success(t("register.signatureSavedSuccess"));

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

  const translateValidationMessage = (message: string) => {
    const map: Record<string, string> = {
      "Please enter a valid email address": t("register.errors.invalidEmail"),
      "Phone number must be exactly 10 digits (e.g., 2156678899)":
        t("register.errors.invalidPhone"),
      "Name is required": t("register.errors.nameRequired"),
      "Name can only contain letters, spaces, hyphens, and apostrophes":
        t("register.errors.nameInvalidChars"),
      "Field contains invalid characters":
        t("register.errors.fieldInvalidChars"),
      "Email address is required": t("register.errors.emailRequired"),
      "Phone number is required": t("register.errors.phoneRequired"),
      "Please select a preferred site": t("register.errors.siteRequired"),
      "You must accept the waiver to continue":
        t("register.errors.waiverAcceptRequired"),
      "You must sign the waiver to continue":
        t("register.errors.waiverSignatureRequired"),
      "Please select a reason for your community service":
        t("register.errors.serviceReasonRequired"),
      "Please specify your reason for community service":
        t("register.errors.serviceReasonOtherRequired"),
      "Please enter the institution requiring your service":
        t("register.errors.serviceInstitutionRequired"),
      "Reason contains invalid characters":
        t("register.errors.reasonInvalidChars"),
      "Institution name contains invalid characters":
        t("register.errors.institutionInvalidChars"),
      "Please select a registration type (Community Service or Employee)":
        t("register.errors.registrationTypeRequired"),
    };

    return map[message] || message;
  };

  // Form validation for each step using Zod
  const validateStep = () => {
    try {
      if (step === 1) {
        // For specialized registrations, check if volunteerType is selected
        if (
          isSpecializedRegistration &&
          formData.volunteerType !== "communityService" &&
          formData.volunteerType !== "employment"
        ) {
          setErrors({
            volunteerType: t("register.errors.registrationTypeRequired"),
          });
          toast.error(t("register.errors.registrationTypeToastTitle"), {
            description: t("register.errors.registrationTypeToastDescription"),
          });
          return false;
        }
        // Validate personal information
        validatePersonalInfo(formData, isSpecializedRegistration);
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
          errorMap[fieldName] = translateValidationMessage(err.message);
        });

        // Set the errors
        setErrors(errorMap);

        // Show the first error as a toast
        if (error.errors.length > 0) {
          toast.error(translateValidationMessage(error.errors[0].message));
        }
      } else {
        // Handle unexpected errors
        console.error("Validation error:", error);
        toast.error(t("register.errors.validationFailed"));
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      // Ensure BOTH email AND phone are provided before proceeding
      if (step === 1) {
        if (!formData.email || !formData.phone) {
          if (!formData.email) {
            setErrors((prev) => ({
              ...prev,
              email: t("register.errors.emailRequired"),
            }));
          }
          if (!formData.phone) {
            setErrors((prev) => ({
              ...prev,
              phone: t("register.errors.phoneRequired"),
            }));
          }
          toast.error(t("register.errors.emailPhoneRequired"));
          return;
        }

        // Now check for duplicate volunteer
        setIsLoading(true);

        checkDuplicateVolunteer(formData.email, formData.phone)
          .then(({ isDuplicate, message }) => {
            if (isDuplicate) {
              setErrors({
                ...errors,
                duplicate: message || t("register.errors.duplicateVolunteer"),
              });
              toast.error(
                `${t("register.errors.registrationFailed")} ${message || ""}`.trim()
              );
              setIsLoading(false);
              return;
            }

            // No duplicate found, proceed to next step
            setStep(step + 1);
            window.scrollTo(0, 0);
            setIsLoading(false);
          })
          .catch((error) => {
            console.error("Error checking for duplicate volunteer:", error);
            toast.error(t("register.errors.genericTryAgain"));
            setIsLoading(false);
          });
      } else {
        // For other steps, simply move forward
        setStep(step + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Remove the comprehensive validation since we already validate at each step
    // We'll just validate the current step again to be safe
    if (!validateStep()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create a unique ID for the volunteer
      const volunteerId = uuidv4();

      // For regular volunteers, set a default volunteer type
      const finalFormData = {
        ...formData,
        // If not a specialized registration, set volunteerType to "regular"
        ...(!isSpecializedRegistration && { volunteerType: "regular" }),
      };

      const newVolunteer = {
        id: volunteerId,
        ...finalFormData,
        registrationDate: new Date().toISOString(),
      };

      // Save to Firestore
      const result = await saveVolunteer(newVolunteer);

      if (result.success) {
        toast.success(t("register.registrationSuccessTitle"), {
          description: t("register.registrationSuccessDescription"),
        });

        // Try to save to localStorage as a backup, but don't block registration if it fails
        try {
          const volunteers = JSON.parse(
            localStorage.getItem("volunteers") || "[]"
          );
          volunteers.push(newVolunteer);
          localStorage.setItem("volunteers", JSON.stringify(volunteers));
        } catch (error) {
          // Log the error but continue with registration
          console.error("Failed to save to localStorage:", error);
          // This is non-blocking - registration is still successful
        }

        router.push(`/volunteer-dashboard/${volunteerId}`);
      } else {
        toast.error(t("register.errors.registrationFailed"), {
          description: t("register.errors.tryAgainOrSupport"),
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error(t("register.errors.registrationFailed"), {
        description: t("register.errors.tryAgainOrSupport"),
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
              <h3 className="text-lg font-medium">
                {t("register.personalInformation")}
              </h3>

              {errors.duplicate && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {errors.duplicate}
                </div>
              )}

              {/* Only show Registration Type section for specialized registrations */}
              {isSpecializedRegistration && (
                <div className="space-y-4">
                  <Label>
                    {t("register.registrationType")}{" "}
                    <span className="text-red-700">*</span>
                  </Label>
                  {errors.volunteerType && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                      {errors.volunteerType}
                    </div>
                  )}
                  <RadioGroup
                    value={formData.volunteerType}
                    onValueChange={handleVolunteerTypeChange}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2 border p-4 rounded-md">
                      <RadioGroupItem
                        value="communityService"
                        id="communityService"
                      />
                      <Label
                        htmlFor="communityService"
                        className="font-medium cursor-pointer"
                      >
                        {t("register.communityService")}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border p-4 rounded-md">
                      <RadioGroupItem value="employment" id="employment" />
                      <Label
                        htmlFor="employment"
                        className="font-medium cursor-pointer"
                      >
                        {t("register.employee")}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {t("register.firstName")} <span className="text-red-700">*</span>
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
                    {t("register.lastName")} <span className="text-red-700">*</span>
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
                  <Label htmlFor="email">
                    {t("register.emailAddress")}
                    <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-red-500" : ""}
                    required={true}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {t("register.phoneNumber")}
                    <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required={true}
                    placeholder={t("register.phonePlaceholder")}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-500 italic mt-1">
                {t("register.emailPhoneRequired")}
              </p>

              {/* Only show these sections for specialized registrations with community service type */}
              {isSpecializedRegistration &&
                formData.volunteerType === "communityService" && (
                  <div className="space-y-4 border-t pt-4 mt-4">
                    <h4 className="font-medium">
                      {t("register.communityServiceInformation")}
                    </h4>

                    <div className="space-y-2">
                      <Label htmlFor="serviceReason">
                        {t("register.reasonForService")}{" "}
                        <span className="text-red-700">*</span>
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
                          <SelectValue placeholder={t("register.selectReason")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="court-ordered">
                            {t("register.courtOrdered")}
                          </SelectItem>
                          <SelectItem value="school">{t("register.school")}</SelectItem>
                          <SelectItem value="work">{t("register.work")}</SelectItem>
                          <SelectItem value="other">{t("register.other")}</SelectItem>
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
                            placeholder={t("register.specifyReason")}
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
                        {t("register.assigningInstitution")}{" "}
                        <span className="text-red-700">*</span>
                      </Label>
                      <Input
                        id="serviceInstitution"
                        name="serviceInstitution"
                        value={formData.serviceInstitution}
                        onChange={handleChange}
                        placeholder={t("register.assigningInstitutionPlaceholder")}
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

              {/* Only show employment info for specialized registrations with employment type */}
              {isSpecializedRegistration &&
                formData.volunteerType === "employment" && (
                  <div className="space-y-4 border-t pt-4 mt-4">
                    <h4 className="font-medium">{t("register.employeeInfo")}</h4>
                    <p className="text-sm text-gray-600">
                      {t("register.employeeInfoDescription")}
                    </p>
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
                {t("common.back")}
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
                  {t("register.continueToSiteSelection")}
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
                {t("register.selectPreferredSite")}
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
                      {t("register.westPhiladelphia")}
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
                      {t("register.springGarden")}
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
                      {t("register.ambler")}
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-2 border p-4 rounded-md ${
                      errors.site ? "border-red-500" : ""
                    }`}
                  >
                    <RadioGroupItem value="reading" id="reading" />
                    <Label
                      htmlFor="reading"
                      className="font-medium cursor-pointer"
                    >
                      {t("register.reading")}
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
                {t("common.back")}
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
                  {t("register.continueToWaiver")}
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
              {t("register.waiver.title")}
            </h3>
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
                {t("register.waiver.acceptLabel")}
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
                  {t("register.waiver.signBelow")}
                </Label>
                {signatureSaved && (
                  <span className="text-green-600 text-sm">
                    {t("register.waiver.signatureSaved")}
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

            {!signatureSaved && (
              <p className="text-amber-600 text-sm">
                {t("register.waiver.signBeforeContinue")}
              </p>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                {t("common.back")}
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
                      {t("register.registering")}
                    </>
                  ) : (
                    t("register.completeRegistration")
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
                <CardTitle>
                  {isSpecializedRegistration
                    ? t("register.specializedRegistrationTitle")
                    : t("register.volunteerRegistrationTitle")}
                </CardTitle>
                <CardDescription>
                  {isSpecializedRegistration
                    ? t("register.specializedRegistrationDescription")
                    : t("register.volunteerRegistrationDescription")}
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
                {t("register.progress.personalInfo")}
              </span>
              <span className={step >= 2 ? "text-red-700 font-medium" : ""}>
                {t("register.progress.siteSelection")}
              </span>
              <span className={step >= 3 ? "text-red-700 font-medium" : ""}>
                {t("register.progress.waiver")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>{renderStepContent()}</form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {t("register.footerThankYou")}
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
