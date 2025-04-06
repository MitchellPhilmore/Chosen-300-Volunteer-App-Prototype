"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserPlus, LogIn, ChevronRight, Heart } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function SplashScreen() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md text-center mb-8"
      >
        <Image
          src="/chosen-01.jpg"
          alt="Chosen 300 Logo"
          width={300}
          height={80}
          className="mx-auto mb-4"
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-gray-600">Volunteer Time Tracking System</p>
        </motion.div>
      </motion.div>

      {isLoaded && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-md space-y-6"
        >
          <motion.div variants={item}>
            <Button
              onClick={() => router.push("/signin")}
              size="lg"
              className="w-full h-20 text-xl bg-red-700 hover:bg-red-800 group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-0 bg-white transition-all duration-[400ms] ease-out group-hover:w-full opacity-10"></div>
              <div className="flex items-center justify-center space-x-3">
                <LogIn className="h-6 w-6" />
                <span>Sign In</span>
                <ChevronRight className="h-5 w-5 opacity-70" />
              </div>
            </Button>
          </motion.div>

          <motion.div variants={item}>
            <Button
              onClick={() => router.push("/register")}
              size="lg"
              variant="outline"
              className="w-full h-20 text-xl border-red-700 text-red-700 hover:bg-red-50 hover:text-red-800 group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-0 bg-red-700 transition-all duration-[400ms] ease-out group-hover:w-full opacity-10"></div>
              <div className="flex items-center justify-center space-x-3">
                <UserPlus className="h-6 w-6" />
                <span>Register as New Volunteer</span>
                <ChevronRight className="h-5 w-5 opacity-70" />
              </div>
            </Button>
          </motion.div>

          <motion.div variants={item} className="pt-8 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <span>Making a difference together</span>
              <Heart className="h-3 w-3 ml-1 text-red-500" />
            </p>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-4 text-xs text-gray-400"
      >
        © {new Date().getFullYear()} Chosen 300 Ministries
      </motion.div>
    </div>
  );
}
