"use client";

import AdminDashboard from "@/components/admin-dashboard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";
    if (!isAdmin) {
      router.replace("/admin/login");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-700" />
      </div>
    );
  }

  return <AdminDashboard />;
}
