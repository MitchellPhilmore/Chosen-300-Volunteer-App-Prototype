"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserPlus, LogIn, Heart, Music, Gift } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function SplashScreen() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

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
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Content */}
      <div className="relative flex-1">
        {/* Watermark background */}

        {/* Logo and subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mx-auto w-full max-w-md px-6 pt-8 pb-4 text-center"
        >
          <Image
            src="/chosen-01.jpg"
            alt="Chosen 300 Logo"
            width={240}
            height={64}
            className="mx-auto"
          />
          <p className="mt-2 text-sm text-gray-600">Volunteer Time Tracking System</p>
        </motion.div>

        {/* Grid of tiles */}
        {isLoaded && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="relative mx-auto w-full max-w-md px-6 grid grid-cols-2 gap-4"
          >
            {/* Tile 1 */}
            <motion.button
              variants={item}
              onClick={() => router.push("/signin")}
              className="h-40 rounded-2xl bg-gradient-to-br from-[#e7000b] to-[#7f1d1d]  text-white shadow-md active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6BBD]"
              aria-label="Already Registered"
            >
              <div className="h-full w-full flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-white/95 flex items-center justify-center mb-3">
                  <LogIn className="h-7 w-7 text-[#7f1d1d]" />
                </div>
                <span className="text-sm font-medium">Already Registered</span>
              </div>
            </motion.button>

            {/* Tile 2 */}
            <motion.button
              variants={item}
              onClick={() => router.push("/register")}
              className="h-40 rounded-2xl bg-gradient-to-br from-[#e7000b] to-[#7f1d1d]  text-white shadow-md active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6BBD]"
              aria-label="Register as New Volunteer"
            >
              <div className="h-full w-full flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-white/95 flex items-center justify-center mb-3">
                  <UserPlus className="h-7 w-7 text-[#7f1d1d]" />
                </div>
                <span className="text-sm font-medium">Register as New Volunteer</span>
              </div>
            </motion.button>

            {/* Tile 3 */}
            <motion.button
              variants={item}
              onClick={() => router.push("/register?type=specialized")}
              className="h-40 rounded-2xl bg-gradient-to-br from-[#e7000b] to-[#7f1d1d]  text-white shadow-md active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6BBD]"
              aria-label="Register for Community Service/Employment"
            >
              <div className="h-full w-full flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-white/95 flex items-center justify-center mb-3">
                  <Heart className="h-7 w-7 text-[#7f1d1d]" />
                </div>
                <span className="text-sm font-medium">Community Service / Employment</span>
              </div>
            </motion.button>

            {/* Tile 4 */}
            <motion.button
              variants={item}
              onClick={() => router.push("/musician-register")}
              className="h-40 rounded-2xl bg-gradient-to-br from-[#e7000b] to-[#7f1d1d]  text-white shadow-md active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6BBD]"
              aria-label="Register as Musician"
            >
              <div className="h-full w-full flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-white/95 flex items-center justify-center mb-3">
                  <Music className="h-7 w-7 text-[#7f1d1d]" />
                </div>
                <span className="text-sm font-medium">Register as Musician</span>
              </div>
            </motion.button>

            {/* Tile 5 - Clothing Donations (full width) */}
            <motion.button
              variants={item}
              onClick={() => router.push("/donations")}
              className="col-span-2 h-40 rounded-2xl bg-gradient-to-br from-[#e7000b] to-[#7f1d1d] text-white shadow-md active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b91c1c]"
              aria-label="Clothing Donations"
            >
              <div className="h-full w-full flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-white/95 flex items-center justify-center mb-3">
                  <Gift className="h-7 w-7 text-[#7f1d1d]" />
                </div>
                <span className="text-sm font-medium">Clothing Donations</span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
