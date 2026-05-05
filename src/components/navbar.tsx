"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/i18n-context";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const router = useRouter();
  const { locale, setLocale, t, isAdminRoute } = useI18n();

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
      <div className="container flex h-16 items-center justify-end">
        <div className="hidden md:flex md:items-center md:space-x-4">
          {isAdminLoggedIn && (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("navbar.logout")}
            </Button>
          )}
          {!isAdminRoute && (
            <select
              aria-label={t("navbar.language")}
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "es")}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm"
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
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
              {isAdminLoggedIn && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("navbar.logout")}
                </Button>
              )}
              {!isAdminRoute && (
                <select
                  aria-label={t("navbar.language")}
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as "en" | "es")}
                  className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                >
                  <option value="en">EN</option>
                  <option value="es">ES</option>
                </select>
              )}
              <Link href="/" onClick={() => setIsOpen(false)} passHref>
                <Button variant="ghost" className="w-full justify-start">
                  {t("navbar.home")}
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
