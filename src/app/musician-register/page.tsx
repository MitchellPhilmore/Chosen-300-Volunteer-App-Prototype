"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music, ChevronRight } from "lucide-react";
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

    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your full name");
      return;
    }

    if (!formData.email && !formData.phone) {
      toast.error("Please provide either an email or phone number");
      return;
    }

    if (formData.instruments.length === 0) {
      toast.error("Please select at least one instrument you play");
      return;
    }

    // Store musician data in localStorage
    const musicians = JSON.parse(localStorage.getItem("musicians") || "[]");

    // Check if musician already exists
    const existingMusician = musicians.find(
      (m: any) =>
        (m.email && m.email === formData.email) ||
        (m.phone && m.phone === formData.phone) ||
        (m.name &&
          m.name.toLowerCase() ===
            `${formData.firstName} ${formData.lastName}`.toLowerCase())
    );

    if (existingMusician) {
      toast.error(
        "A musician with this name, email, or phone number already exists"
      );
      return;
    }

    const musicianId = crypto.randomUUID();

    const newMusician = {
      id: musicianId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      instruments: formData.instruments,
      experience: formData.experience,
      availability: formData.availability,
      registrationDate: new Date().toISOString(),
    };
    console.log(newMusician);

    musicians.push(newMusician);
    localStorage.setItem("musicians", JSON.stringify(musicians));

    toast.success("Registration successful!", {
      description: "Thank you for registering as a musician.",
    });

    router.push(`/musician-dashboard/${musicianId}`);
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Instruments Played <span className="text-red-700">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                  {INSTRUMENTS.map((instrument) => (
                    <div
                      key={instrument.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`musician-${instrument.id}`}
                        checked={formData.instruments.includes(instrument.id)}
                        onCheckedChange={() =>
                          handleInstrumentChange(instrument.id)
                        }
                      />
                      <Label
                        htmlFor={`musician-${instrument.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {instrument.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Musical Experience</Label>
                <Input
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g., Years of experience, previous performances, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  placeholder="e.g., Weekends, evenings, special events"
                />
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
                    <Music className="h-6 w-6" />
                    <span>Complete Registration</span>
                    <ChevronRight className="h-5 w-5 opacity-70" />
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
