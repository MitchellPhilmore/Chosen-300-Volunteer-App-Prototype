"use client";

import AdminDashboard from "@/components/admin-dashboard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { Auth } from "firebase/auth";

export default function AdminPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth as Auth, (user) => {
      if (user) {
        console.log("Admin user authenticated, showing dashboard.");
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
      } else {
        console.log("Admin user not authenticated, redirecting to login.");
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        router.replace("/admin/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-700" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  return isAuthenticated ? <AdminDashboard /> : null;
}
