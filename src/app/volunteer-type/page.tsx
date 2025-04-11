"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, UserPlus, Scale, Heart } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VolunteerTypeSelection() {
  const router = useRouter();

  const handleTypeSelection = (type: string) => {
    // Store the volunteer type in localStorage for use in registration
    localStorage.setItem("volunteerType", type);
    router.push("/register");
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
                <CardTitle>Volunteer Registration</CardTitle>
                <CardDescription>
                  Please select your volunteer type
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleTypeSelection("normal")}
                size="lg"
                className="w-full h-24 text-xl bg-red-700 hover:bg-red-800 group relative overflow-hidden"
              >
                <div className="absolute inset-0 w-0 bg-white transition-all duration-[400ms] ease-out group-hover:w-full opacity-10"></div>
                <div className="flex items-center justify-center space-x-3">
                  <UserPlus className="h-6 w-6" />
                  <div className="text-left">
                    <div>Normal Volunteer</div>
                    <div className="text-sm font-normal opacity-80">
                      I'm volunteering by personal choice
                    </div>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 opacity-70" />
                </div>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleTypeSelection("communityService")}
                size="lg"
                variant="outline"
                className="w-full h-24 text-xl border-red-700 text-red-700 hover:bg-red-50 hover:text-red-800 group relative overflow-hidden"
              >
                <div className="absolute inset-0 w-0 bg-red-700 transition-all duration-[400ms] ease-out group-hover:w-full opacity-10"></div>
                <div className="flex items-center justify-center space-x-3">
                  <Scale className="h-6 w-6" />
                  <div className="text-left">
                    <div>Community Service Volunteer</div>
                    <div className="text-sm font-normal opacity-80">
                      I'm fulfilling court/school required service
                    </div>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 opacity-70" />
                </div>
              </Button>
            </motion.div>
          </CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-center p-6 text-xs text-gray-400"
          >
            <p className="flex items-center justify-center">
              <span>Making a difference together</span>
              <Heart className="h-3 w-3 ml-1 text-red-500" />
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
