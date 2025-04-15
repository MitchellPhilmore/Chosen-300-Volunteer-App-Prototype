"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Lock, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    setIsAdminLoggedIn(loggedIn);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    setIsAdminLoggedIn(false);
    toast.info("Logged out successfully");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
       

        <div className="hidden md:flex md:items-center md:space-x-4">
          {isAdminLoggedIn ? (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Admin Logout
            </Button>
          ) : (
            <Link href="/admin/login" passHref>
              <Button
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <Lock className="mr-2 h-4 w-4" />
                Admin Login
              </Button>
            </Link>
          )}
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[240px] sm:w-[300px]">
            <div className="flex flex-col space-y-4 mt-8">
              {isAdminLoggedIn ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Admin Logout
                </Button>
              ) : (
                <Link href="/admin/login" passHref>
                  <Button
                    variant="outline"
                    className="border-red-700 text-red-700 hover:bg-red-50 hover:text-red-800 w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Admin Login
                  </Button>
                </Link>
              )}
              <Link href="/" onClick={() => setIsOpen(false)} passHref>
                <Button variant="ghost" className="w-full justify-start">
                  Home
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
