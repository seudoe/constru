"use client";

import {
  LayoutDashboard,
  FileText,
  LogOut,
  UserPlus,
  Package,
  Move,
  Menu,
  X,
  ClipboardList,
  BarChart3,
  Settings,
  FileCheck,
  Calculator,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-browser";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/manager/dashboard",
    description: "Overview & Analytics"
  },
  {
    icon: UserPlus,
    label: "Add Workers",
    href: "/manager/addWorker",
    description: "Manage Team"
  },
  {
    icon: FileCheck,
    label: "AI Contracts",
    href: "/manager/contracts",
    description: "Smart Contract Generation"
  },
  {
    icon: FileText,
    label: "Procurement (Manager)",
    href: "/manager/material-requests",
    description: "Approvals & POs"
  },
  {
    icon: Truck, // Need to import Truck
    label: "Incoming Shipments",
    href: "/engineer/grn",
    description: "Engineer GRN Verification"
  },
  {
    icon: ClipboardList,
    label: "Supplier Portal",
    href: "/supplier/portal",
    description: "Submit Bills (Mock)"
  },
  {
    icon: Package,
    label: "Inventory",
    href: "/inventory",
    description: "Stock Management"
  },
  {
    icon: Move,
    label: "Movements",
    href: "/movements",
    description: "Material Tracking"
  },
  {
    icon: Calculator,
    label: "Cost Estimation",
    href: "/cost-estimation",
    description: "Budget Calculator"
  },
];

const generalItems = [
  { icon: Settings, label: "Settings", href: "/settings", description: "App Configuration" },
  { icon: LogOut, label: "Logout", href: "#logout", description: "Sign Out" }
];

export function UnifiedSidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      router.push("/"); // Redirect to home after logout
    } catch (error) {
      console.log(error);
    }
  };

  const handleNavigation = (href: string, label: string) => {
    if (href === "#logout") {
      handleLogout();
    } else {
      router.push(href);
    }
  };

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - EXACT SAME AS DASHBOARD */}
      <aside
        className={cn(
          "fixed top-0 left-0 w-72 bg-white border-r border-gray-200 p-6 h-screen overflow-y-auto z-40 transition-transform duration-300 ease-in-out shadow-xl",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-white absolute" style={{ top: "35%", left: "35%" }} />
              <div className="w-2 h-2 rounded-full bg-white absolute" style={{ top: "35%", right: "35%" }} />
              <div className="w-4 h-2 border-b-2 border-white rounded-full absolute bottom-3" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">BuildTrack</span>
              <p className="text-xs text-gray-500">Construction Management</p>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="mb-6 px-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-sm font-medium">
            <BarChart3 className="w-4 h-4" />
            <span>Manager Dashboard</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider px-1">
              Main Menu
            </p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.href, item.label)}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/25"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      hoveredItem === item.label && !isActive && "translate-x-1 bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-white/20"
                        : "bg-gray-100 group-hover:bg-gray-200"
                    )}>
                      <item.icon className={cn(
                        "w-5 h-5",
                        isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"
                      )} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <p className={cn(
                        "text-xs mt-0.5",
                        isActive ? "text-amber-100" : "text-gray-400"
                      )}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider px-1">
              General
            </p>
            <nav className="space-y-1">
              {generalItems.map((item) => {
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.href, item.label)}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left font-medium transition-all duration-200 group",
                      "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      hoveredItem === item.label && "translate-x-1 bg-gray-50"
                    )}
                  >
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                      <item.icon className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            BuildTrack v2.0
          </p>
        </div>
      </aside>
    </>
  );
}