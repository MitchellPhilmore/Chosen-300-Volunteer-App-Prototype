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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MusicianRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    instrument: "",
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

    if (!formData.instrument) {
      toast.error("Please select your primary instrument");
      return;
    }

    // Store musician data in localStorage
    const musicians = JSON.parse(localStorage.getItem("musicians") || "[]");
    const musicianId = `mus-${Date.now()}`;

    const newMusician = {
      id: musicianId,
      ...formData,
      registrationDate: new Date().toISOString(),
    };

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
                <Label htmlFor="instrument">
                  Primary Instrument <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={formData.instrument}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, instrument: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piano">Piano</SelectItem>
                    <SelectItem value="guitar">Guitar</SelectItem>
                    <SelectItem value="drums">Drums</SelectItem>
                    <SelectItem value="bass">Bass</SelectItem>
                    <SelectItem value="vocals">Vocals</SelectItem>
                    <SelectItem value="violin">Violin</SelectItem>
                    <SelectItem value="saxophone">Saxophone</SelectItem>
                    <SelectItem value="trumpet">Trumpet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
