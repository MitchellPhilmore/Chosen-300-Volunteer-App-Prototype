"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { saveDonation } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignatureMaker } from "@docuseal/signature-maker-react";
import { useI18n } from "@/i18n/i18n-context";

export default function DonationsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    orgName: "",
    email: "",
    phone: "",
    address: "",
    preferredContact: { phone: false, email: false, text: false },
    categories: { 
      clothing: false, 
      bricABrac: false, 
      food: false, 
      toys: false, 
      furniture: false, 
      electronics: false, 
      schoolOfficeSupplies: false, 
      hygienePersonalCare: false, 
      cleaningHouseholdEssentials: false, 
      petSupplies: false 
    },
    quantity: "",
    items: "",
    notes: "",
    method: "",
    waiverAccepted: false,
    waiverSignature: null as string | null,
  });

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = t("donations.errors.firstNameRequired");
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = t("donations.errors.lastNameRequired");
      }
      if (!formData.phone.trim()) {
        newErrors.phone = t("donations.errors.phoneRequired");
      }
      // Email is optional, but if provided should be valid
      if (formData.email && !formData.email.includes("@")) {
        newErrors.email = t("donations.errors.invalidEmail");
      }
    } else if (step === 2) {
      // Check if at least one donation category is selected
      const hasCategorySelected = Object.values(formData.categories).some(Boolean);

      if (!hasCategorySelected) {
        newErrors.categories = t("donations.errors.categoryRequired");
      }
      if(!formData.quantity) {
         newErrors.quantity = t("donations.errors.quantityRequired");
      }
    } else if (step === 3) {
      if (!formData.method) {
        newErrors.method = t("donations.errors.locationRequired");
      }
    } else if (step === 4) {
      if (!formData.waiverAccepted) {
        newErrors.waiverAccepted = t("donations.errors.noticeAcceptRequired");
      }
      if (!formData.waiverSignature) {
        newErrors.waiverSignature = t("donations.errors.signatureRequired");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a unique ID for the donation
      const donationId = uuidv4();

      // Create the donation object
      const donationData = {
        id: donationId,
        ...formData,
      };

      // Save to Firestore
      const result = await saveDonation(donationData);

      if (result.success) {
        toast.success(t("donations.successTitle"), {
          description: t("donations.successDescription"),
        });
        router.push("/");
      } else {
        toast.error(t("donations.errors.submitFailed"), {
          description: t("donations.errors.submitFailedDescription"),
        });
      }
    } catch (error) {
      console.error("Donation submission error:", error);
      toast.error(t("donations.errors.submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for the field being changed
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };



  const handleCategoriesChange = (category: string, checked: boolean) => {
    handleChange("categories", {
      ...formData.categories,
      [category]: checked,
    });
  };

  // Special handling for phone numbers to strip non-digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    handleChange("phone", digitsOnly);
  };

  const handleWaiverChange = (checked: boolean) => {
    handleChange("waiverAccepted", checked);
  };

  const handleWaiverSignatureChange = (signatureData: any) => {
    if (signatureData && signatureData.base64) {
      handleChange("waiverSignature", signatureData.base64);
      setSignatureSaved(true);
      toast.success(t("donations.signatureSavedSuccess"));
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
              <h3 className="text-lg font-medium">{t("donations.contactInformation")}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">
                    {t("donations.firstName")} <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder={t("donations.firstNamePlaceholder")}
                    required
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastName">
                    {t("donations.lastName")} <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder={t("donations.lastNamePlaceholder")}
                    required
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="org">{t("donations.organizationName")}</Label>
                <Input
                  id="org"
                  value={formData.orgName}
                  onChange={(e) => handleChange("orgName", e.target.value)}
                  placeholder={t("donations.organizationPlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t("donations.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder={t("donations.emailPlaceholder")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">
                  {t("donations.phone")} <span className="text-red-700">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder={t("donations.phonePlaceholder")}
                  required
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
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
                  className="w-full bg-[#e7000b] hover:bg-[#b8060e]"
                >
                  {t("donations.continue")}
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
              <h3 className="text-lg font-medium">{t("donations.detailsTitle")}</h3>

              <div className="grid gap-2">
                <Label>
                  {t("donations.categories")} <span className="text-red-700">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.clothing} onCheckedChange={(v) => handleCategoriesChange("clothing", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.clothing")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.bricABrac} onCheckedChange={(v) => handleCategoriesChange("bricABrac", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.bricABrac")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.food} onCheckedChange={(v) => handleCategoriesChange("food", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.food")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.toys} onCheckedChange={(v) => handleCategoriesChange("toys", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.toys")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.furniture} onCheckedChange={(v) => handleCategoriesChange("furniture", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.furniture")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.electronics} onCheckedChange={(v) => handleCategoriesChange("electronics", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.electronics")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.schoolOfficeSupplies} onCheckedChange={(v) => handleCategoriesChange("schoolOfficeSupplies", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.schoolOfficeSupplies")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.hygienePersonalCare} onCheckedChange={(v) => handleCategoriesChange("hygienePersonalCare", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.hygienePersonalCare")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.cleaningHouseholdEssentials} onCheckedChange={(v) => handleCategoriesChange("cleaningHouseholdEssentials", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.cleaningHouseholdEssentials")}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.petSupplies} onCheckedChange={(v) => handleCategoriesChange("petSupplies", Boolean(v))} />
                    <span className="text-sm">{t("donations.category.petSupplies")}</span>
                  </label>
                </div>
                {errors.categories && (
                  <p className="text-red-500 text-xs mt-1">{errors.categories}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">{t("donations.quantityLabel")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  placeholder={t("donations.quantityPlaceholder")}
                  required
                  className={errors.quantity ? "border-red-500" : ""}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
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
                  className="w-full bg-[#e7000b] hover:bg-[#b8060e]"
                >
                  {t("donations.continue")}
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
              <h3 className="text-lg font-medium">{t("donations.locationTitle")}</h3>

              <div className="grid gap-2">
                <Label htmlFor="dropoff-site">
                  {t("donations.dropoffSite")} <span className="text-red-700">*</span>
                </Label>
                <Select required value={formData.method} onValueChange={(value) => handleChange("method", value)}>
                  <SelectTrigger 
                    id="dropoff-site"
                    className={errors.method ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={t("donations.selectDropoffPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="West Philadelphia">{t("donations.site.westPhiladelphia")}</SelectItem>
                    <SelectItem value="Spring Garden">{t("donations.site.springGarden")}</SelectItem>
                    <SelectItem value="Ambler">{t("donations.site.ambler")}</SelectItem>
                    <SelectItem value="Reading">{t("donations.site.reading")}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.method && (
                  <p className="text-red-500 text-xs mt-1">{errors.method}</p>
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
                  className="w-full bg-[#e7000b] hover:bg-[#b8060e]"
                >
                  {t("donations.continue")}
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("donations.waiver.title")}</h3>
              <div className="max-h-72 overflow-y-auto border rounded-md p-4 text-sm">
                <p className="mb-2">
                  {t("donations.waiver.notice")}
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
                  {t("donations.waiver.acceptLabel")} <span className="text-red-700">*</span>
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
                    {t("donations.waiver.signBelow")} <span className="text-red-700">*</span>
                  </Label>
                  {signatureSaved && (
                    <span className="text-green-600 text-sm">
                      {t("donations.waiver.signatureSaved")}
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
                    saveButtonText={t("donations.waiver.saveSignature")}
                    saveButtonClass="bg-[#e7000b] hover:bg-[#b8060e] text-white px-4 py-2 rounded-md"
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
                  {t("donations.waiver.signBeforeContinue")}
                </p>
              )}
            </div>

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
                  className="w-full bg-[#e7000b] hover:bg-[#b8060e]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("donations.submitting")}
                    </>
                  ) : (
                    t("donations.submit")
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
        <Card className="max-w-2xl mx-auto border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <CardTitle>{t("donations.title")}</CardTitle>
                <CardDescription>
                  {t("donations.description")}
                </CardDescription>
              </div>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full mt-4">
              <div
                className="bg-[#e7000b] h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1 mt-1">
              <span className={step >= 1 ? "text-[#e7000b] font-medium" : ""}>
                {t("donations.progress.contact")}
              </span>
              <span className={step >= 2 ? "text-[#e7000b] font-medium" : ""}>
                {t("donations.progress.details")}
              </span>
              <span className={step >= 3 ? "text-[#e7000b] font-medium" : ""}>
                {t("donations.progress.location")}
              </span>
              <span className={step >= 4 ? "text-[#e7000b] font-medium" : ""}>
                {t("donations.progress.waiver")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>{renderStepContent()}</form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


