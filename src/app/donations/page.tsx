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

export default function DonationsPage() {
  const router = useRouter();
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
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      }
      // Email is optional, but if provided should be valid
      if (formData.email && !formData.email.includes("@")) {
        newErrors.email = "Please enter a valid email address";
      }
    } else if (step === 2) {
      // Check if at least one donation category is selected
      const hasCategorySelected = Object.values(formData.categories).some(Boolean);

      if (!hasCategorySelected) {
        newErrors.categories = "Please select at least one donation category";
      }
      if(!formData.quantity) {
         newErrors.quantity = "Please select at least 1 or more bags/boxes";
      }
    } else if (step === 3) {
      if (!formData.method) {
        newErrors.method = "Please select a drop-off location";
      }
    } else if (step === 4) {
      if (!formData.waiverAccepted) {
        newErrors.waiverAccepted = "You must accept the waiver to continue";
      }
      if (!formData.waiverSignature) {
        newErrors.waiverSignature = "Please sign the waiver to continue";
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
        toast.success("Donation submitted successfully!", {
          description: "Thank you for your clothing donation.",
        });
        router.push("/");
      } else {
        toast.error("Failed to submit donation. Please try again.", {
          description: "There was an error saving your donation.",
        });
      }
    } catch (error) {
      console.error("Donation submission error:", error);
      toast.error("Failed to submit donation. Please try again.");
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
      toast.success("Signature saved successfully!");
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
              <h3 className="text-lg font-medium">Contact Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="Jane"
                    required
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Doe"
                    required
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="org">Organization Name (if applicable)</Label>
                <Input
                  id="org"
                  value={formData.orgName}
                  onChange={(e) => handleChange("orgName", e.target.value)}
                  placeholder="Company / Group"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="jane@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">
                  Phone <span className="text-red-700">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="10 digits only (e.g., 2156678899)"
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
                  className="w-full bg-[#e7000b] hover:bg-[#b8060e]"
                >
                  Continue
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
              <h3 className="text-lg font-medium">Donation Details</h3>

              <div className="grid gap-2">
                <Label>
                  Donation Categories <span className="text-red-700">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.clothing} onCheckedChange={(v) => handleCategoriesChange("clothing", Boolean(v))} />
                    <span className="text-sm">Clothing</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.bricABrac} onCheckedChange={(v) => handleCategoriesChange("bricABrac", Boolean(v))} />
                    <span className="text-sm">Bric-a-Brac</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.food} onCheckedChange={(v) => handleCategoriesChange("food", Boolean(v))} />
                    <span className="text-sm">Food</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.toys} onCheckedChange={(v) => handleCategoriesChange("toys", Boolean(v))} />
                    <span className="text-sm">Toys</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.furniture} onCheckedChange={(v) => handleCategoriesChange("furniture", Boolean(v))} />
                    <span className="text-sm">Furniture</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.electronics} onCheckedChange={(v) => handleCategoriesChange("electronics", Boolean(v))} />
                    <span className="text-sm">Electronics</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.schoolOfficeSupplies} onCheckedChange={(v) => handleCategoriesChange("schoolOfficeSupplies", Boolean(v))} />
                    <span className="text-sm">School & Office Supplies</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.hygienePersonalCare} onCheckedChange={(v) => handleCategoriesChange("hygienePersonalCare", Boolean(v))} />
                    <span className="text-sm">Hygiene & Personal Care</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.cleaningHouseholdEssentials} onCheckedChange={(v) => handleCategoriesChange("cleaningHouseholdEssentials", Boolean(v))} />
                    <span className="text-sm">Cleaning & Household Essentials</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox checked={formData.categories.petSupplies} onCheckedChange={(v) => handleCategoriesChange("petSupplies", Boolean(v))} />
                    <span className="text-sm">Pet Supplies</span>
                  </label>
                </div>
                {errors.categories && (
                  <p className="text-red-500 text-xs mt-1">{errors.categories}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity or Number of Bags/Boxes</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  placeholder="e.g., 3 bags"
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
                  className="w-full bg-[#e7000b] hover:bg-[#b8060e]"
                >
                  Continue
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
              <h3 className="text-lg font-medium">Drop-off Location</h3>

              <div className="grid gap-2">
                <Label htmlFor="dropoff-site">
                  Drop-off site <span className="text-red-700">*</span>
                </Label>
                <Select required value={formData.method} onValueChange={(value) => handleChange("method", value)}>
                  <SelectTrigger 
                    id="dropoff-site"
                    className={errors.method ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a drop-off location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="West Philadelphia">West Philadelphia</SelectItem>
                    <SelectItem value="Spring Garden">Spring Garden</SelectItem>
                    <SelectItem value="Ambler">Ambler</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
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
                  className="w-full bg-[#e7000b] hover:bg-[#b8060e]"
                >
                  Continue
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
              <h3 className="text-lg font-medium">Tax Deduction Notice</h3>
              <div className="max-h-72 overflow-y-auto border rounded-md p-4 text-sm">
                <p className="mb-2">
                  Chosen 300 does not determine the value or deductibility of your donation. Please consult with the IRS or your tax advisor for direction.
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
                  I have read and understand the Tax Deduction Notice <span className="text-red-700">*</span>
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
                    Please sign below <span className="text-red-700">*</span>
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
                  Please sign and click "Save Signature" before continuing
                </p>
              )}
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
                  className="w-full bg-[#e7000b] hover:bg-[#b8060e]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Donation"
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
                <CardTitle>Donations</CardTitle>
                <CardDescription>
                  Submit your donation to Chosen 300
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
                Contact
              </span>
              <span className={step >= 2 ? "text-[#e7000b] font-medium" : ""}>
                Details
              </span>
              <span className={step >= 3 ? "text-[#e7000b] font-medium" : ""}>
                Location
              </span>
              <span className={step >= 4 ? "text-[#e7000b] font-medium" : ""}>
                Waiver
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


