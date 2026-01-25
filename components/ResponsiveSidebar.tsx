"use client";

import LanguageSettings from "@/components/LanguageSettings";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  UserPlus,
  Package,
  Move,
  Menu,
  X,
  BarChart3,
  Settings,
  FileCheck,
  Calculator,
  Building2,
  Truck,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  key: string;
  href: string;
  descKey: string;
  roles: string[];
}

const allMenuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    key: "dashboard",
    href: "/manager/dashboard",
    descKey: "overview_analytics",
    roles: ["manager", "admin"]
  },
  {
    icon: LayoutDashboard,
    key: "engineer_dashboard",
    href: "/engineer/dashboard",
    descKey: "engineering_overview",
    roles: ["engineer"]
  },
  {
    icon: LayoutDashboard,
    key: "worker_dashboard",
    href: "/construction-worker",
    descKey: "worker_overview",
    roles: ["worker", "construction_worker"]
  },
  {
    icon: UserPlus,
    key: "add_workers",
    href: "/manager/add-worker",
    descKey: "manage_team",
    roles: ["manager", "admin"]
  },
  {
    icon: FileCheck,
    key: "ai_contracts",
    href: "/manager/contracts",
    descKey: "smart_contract_generation",
    roles: ["manager", "admin"]
  },
  {
    icon: FileText,
    key: "gst_invoicing",
    href: "/manager/gst",
    descKey: "tax_billing",
    roles: ["manager", "admin"]
  },
  {
    icon: FileText,
    key: "procurement_manager",
    href: "/manager/material-requests",
    descKey: "approvals_pos",
    roles: ["manager", "admin"]
  },
  {
    icon: Package,
    key: "inventory",
    href: "/manager/inventory",
    descKey: "stock_management",
    roles: ["manager", "admin"]
  },
  {
    icon: Move,
    key: "movements",
    href: "/manager/movements",
    descKey: "material_tracking",
    roles: ["manager", "admin"]
  },
  {
    icon: Calculator,
    key: "cost_estimation",
    href: "/cost-estimation",
    descKey: "budget_calculator",
    roles: ["manager", "admin", "engineer"]
  },
  // Engineer specific routes
  {
    icon: UserPlus,
    key: "add_workers",
    href: "/engineer/add-worker",
    descKey: "manage_team",
    roles: ["engineer"]
  },
  {
    icon: Package,
    key: "inventory",
    href: "/engineer/inventory",
    descKey: "stock_management",
    roles: ["engineer"]
  },
  {
    icon: Move,
    key: "movements",
    href: "/engineer/movements",
    descKey: "material_tracking",
    roles: ["engineer"]
  },
  {
    icon: Truck,
    key: "incoming_shipments",
    href: "/engineer/grn",
    descKey: "engineer_grn_verification",
    roles: ["engineer"]
  },
  {
    icon: ClipboardList,
    key: "supplier_portal",
    href: "/supplier/portal",
    descKey: "submit_bills_mock",
    roles: ["engineer", "manager", "admin"]
  },
  // Owner routes
  {
    icon: LayoutDashboard,
    key: "dashboard",
    href: "/owner/dashboard",
    descKey: "owner_overview",
    roles: ["owner"]
  },
];

const generalItems: MenuItem[] = [
  {
    icon: Settings,
    key: "settings",
    href: "/settings",
    descKey: "app_configuration",
    roles: ["manager", "admin", "engineer", "owner"]
  },
];

export function ResponsiveSidebar() {
  const { t } = useTranslation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<string>("engineer");
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Animation variants
  const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    desktop: { x: 0, opacity: 1 }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: roleData, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (roleData && !error) {
            let mappedRole = roleData.role;
            if (mappedRole === "worker" || mappedRole === "construction_worker") mappedRole = "labour";
            if (mappedRole === "admin") mappedRole = "manager";
            setRole(mappedRole);
          } else {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single();

            if (profileData) {
              let mappedRole = profileData.role;
              if (mappedRole === "worker" || mappedRole === "construction_worker") mappedRole = "labour";
              setRole(mappedRole);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("engineer");
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.log(error);
    }
  };

  const handleNavigation = (href: string) => {
    if (href === "#logout") {
      handleLogout();
    } else {
      router.push(href);
    }
  };

  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(role) ||
    (role === "admin" && item.roles.includes("manager")) ||
    (role === "labour" && (item.roles.includes("worker") || item.roles.includes("construction_worker")))
  );

  const filteredGeneralItems = generalItems.filter(item =>
    item.roles.includes(role) ||
    (role === "admin" && item.roles.includes("manager"))
  );

  if (role === "labour" || role === "worker") {
    return null;
  }

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <AnimatePresence>
        {/* Mobile Overlay */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Toggle */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white/80 backdrop-blur-md border border-orange-100 rounded-xl shadow-lg shadow-orange-500/10 text-orange-600"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        initial="closed"
        animate={isOpen ? "open" : "desktop"}
        variants={sidebarVariants}
        className={cn(
          "fixed top-0 left-0 w-72 h-screen z-50",
          "bg-white/90 backdrop-blur-2xl border-r border-orange-100/50", // Glass effect
          "lg:translate-x-0 shadow-2xl lg:shadow-none",
          "overflow-hidden flex flex-col"
        )}
      >
        {/* Header */}
        <div className="p-6 pb-2">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20"
            >
              <Building2 className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600">
                BuildTrack
              </span>
              <p className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                Manager Control
              </p>
            </div>
          </Link>

          {/* User Role Card */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-6 p-3 rounded-xl border flex items-center gap-3",
                "bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-orange-100" // Premium subtle bg
              )}
            >
              <div className="p-2 bg-white rounded-lg border border-orange-100/50 shadow-sm">
                <UserPlus className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">{role}</p>
                <p className="text-[10px] text-orange-600/80 font-medium">Verified Account</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="space-y-4 px-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl bg-orange-50/50" />)}
            </div>
          ) : (
            <>
              {/* Main Menu */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-4 mb-2">
                  {t('main_menu')}
                </p>
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: {
                      transition: {
                        staggerChildren: 0.05
                      }
                    }
                  }}
                >
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link key={item.key} href={item.href} className="block relative mb-1">
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <motion.div
                          variants={itemVariants}
                          whileHover={{ x: 4 }}
                          className={cn(
                            "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
                            isActive ? "text-white" : "text-muted-foreground hover:bg-orange-50 hover:text-orange-900"
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", isActive ? "text-orange-50" : "text-muted-foreground/70 group-hover:text-orange-600")} />
                          <span className="font-medium text-sm">{t(item.key)}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </motion.div>
              </div>

              {/* Separator */}
              <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent my-4" />

              {/* General Menu */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-4 mb-2">
                  {t('general')}
                </p>
                {filteredGeneralItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link key={item.key} href={item.href} className="block relative mb-1">
                      {isActive && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute inset-0 bg-orange-100 text-orange-900 rounded-xl"
                        />
                      )}
                      <motion.button
                        whileHover={{ x: 4 }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
                          isActive ? "text-orange-900" : "text-muted-foreground hover:bg-orange-50 hover:text-orange-900"
                        )}
                      >
                        <item.icon className="w-5 h-5 opacity-70" />
                        <span className="font-medium text-sm">{t(item.key)}</span>
                      </motion.button>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-white/50 backdrop-blur-sm">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 transition-colors font-semibold text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </motion.button>
          <div className="mt-4 flex justify-center">
            <LanguageSettings />
          </div>
        </div>
      </motion.aside>
    </>
  );
}

// Export as Sidebar for backward compatibility
export const Sidebar = ResponsiveSidebar;
