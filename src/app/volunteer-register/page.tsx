"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

const INSTRUMENTS = [
  { id: "piano", label: "Piano" },
  { id: "guitar", label: "Guitar" },
  { id: "drums", label: "Drums" },
  { id: "bass", label: "Bass" },
  { id: "vocals", label: "Vocals" },
  { id: "violin", label: "Violin" },
  { id: "saxophone", label: "Saxophone" },
  { id: "trumpet", label: "Trumpet" },
  { id: "flute", label: "Flute" },
  { id: "clarinet", label: "Clarinet" },
  { id: "other", label: "Other" },
];

export default function VolunteerRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    instruments: [] as string[],
    waiverAccepted: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInstrumentChange = (instrumentId: string) => {
    setFormData((prev) => ({
      ...prev,
      instruments: prev.instruments.includes(instrumentId)
        ? prev.instruments.filter((id) => id !== instrumentId)
        : [...prev.instruments, instrumentId],
    }));
  };

  const handleWaiverChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      waiverAccepted: checked,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your first and last name");
      return;
    }

    // Validate contact information
    if (!formData.email && !formData.phone) {
      toast.error("Please provide either an email address or phone number");
      return;
    }

    // Validate waiver acceptance
    if (!formData.waiverAccepted) {
      toast.error("You must accept the waiver to continue");
      return;
    }

    // Create new volunteer (include instruments)
    const newVolunteer = {
      id: crypto.randomUUID(),
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      instruments: formData.instruments,
      waiverAccepted: formData.waiverAccepted,
      registrationDate: new Date().toISOString(),
    };

    // Get existing volunteers
    const volunteers = JSON.parse(localStorage.getItem("volunteers") || "[]");

    // Check if volunteer already exists (using combined name now)
    const existingVolunteer = volunteers.find(
      (v: any) =>
        (v.email && v.email === formData.email) ||
        (v.phone && v.phone === formData.phone) ||
        (v.name &&
          v.name.toLowerCase() ===
            `${formData.firstName} ${formData.lastName}`.toLowerCase())
    );

    if (existingVolunteer) {
      toast.error(
        "A volunteer with this name, email, or phone number already exists"
      );
      return;
    }

    // Save to localStorage
    localStorage.setItem(
      "volunteers",
      JSON.stringify([...volunteers, newVolunteer])
    );

    toast.success("Registration successful!");
    router.push(`/volunteer-dashboard/${newVolunteer.id}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md mx-auto border-none shadow-lg">
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
                  Please provide your information to register
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

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
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Instruments Played (Optional)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {INSTRUMENTS.map((instrument) => (
                    <div
                      key={instrument.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`volunteer-${instrument.id}`}
                        checked={formData.instruments.includes(instrument.id)}
                        onCheckedChange={() =>
                          handleInstrumentChange(instrument.id)
                        }
                      />
                      <Label
                        htmlFor={`volunteer-${instrument.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {instrument.label}
                      </Label>
                    </div>
                  ))}
                </div>
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
                    id="waiver-acceptance"
                    checked={formData.waiverAccepted}
                    onCheckedChange={handleWaiverChange}
                  />
                  <Label htmlFor="waiver-acceptance" className="font-medium">
                    I have read and agree to the terms of the Waiver and Release
                    of Liability
                  </Label>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-red-700 hover:bg-red-800"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <UserPlus className="h-6 w-6" />
                    <span>Register</span>
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
