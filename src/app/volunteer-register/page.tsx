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

    // Create new volunteer (include instruments)
    const newVolunteer = {
      id: crypto.randomUUID(),
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      instruments: formData.instruments,
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
