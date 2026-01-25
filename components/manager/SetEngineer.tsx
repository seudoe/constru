// components/shared/SetEngineer.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCog, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";

interface Engineer {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export default function SetEngineer() {
  const [existingEngineer, setExistingEngineer] = useState<Engineer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    checkExistingEngineer();
  }, []);

  async function checkExistingEngineer() {
    try {
      setLoading(true);

      // Use the API endpoint to get all users (bypasses RLS)
      const response = await fetch("/api/admin/create-worker");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const users = await response.json();
      console.log("All users from API:", users);

      // Find the first engineer
      const engineer = users.find((user: any) => user.role === "engineer");
      console.log("Found engineer:", engineer);

      if (engineer) {
        setExistingEngineer({
          id: engineer.id,
          email: engineer.email || "Email not available",
          full_name: engineer.full_name || "Unknown",
          created_at: new Date().toISOString(), // API doesn't return created_at, use current date
        });
      } else {
        console.log("No engineer found in API response");
        setExistingEngineer(null);
      }
    } catch (err) {
      console.error("Error checking engineer:", err);
      setExistingEngineer(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    // Validation
    if (!email || !fullName || !phone || !password) {
      setError("All fields are required.");
      setIsSubmitting(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Phone must be exactly 10 digits.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Double-check no engineer exists using API
      const response = await fetch("/api/admin/create-worker");
      if (response.ok) {
        const users = await response.json();
        const existingEngineer = users.find((user: any) => user.role === "engineer");

        if (existingEngineer) {
          setError("An engineer already exists in the system. Only one engineer is allowed.");
          await checkExistingEngineer(); // Refresh the view
          setIsSubmitting(false);
          return;
        }
      }

      // Create the engineer via API
      const res = await fetch("/api/admin/create-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          password,
          role: "engineer",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create engineer");
      }

      setSuccess("Engineer created successfully!");
      setEmail("");
      setFullName("");
      setPhone("");
      setPassword("");

      // Refresh to show the new engineer
      await checkExistingEngineer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEngineer() {
    if (!existingEngineer) return;

    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      // Use API to update the engineer's role to 'unassigned'
      const response = await fetch("/api/admin/create-worker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: existingEngineer.id,
          role: "unassigned",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to remove engineer role");
      }

      setSuccess("Engineer role removed successfully. User is now unassigned.");
      setExistingEngineer(null);

      // Refresh to update the view
      await checkExistingEngineer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove engineer");
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200/50">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-3 text-indigo-700 font-medium">Checking for existing engineer...</span>
      </div>
    );
  }

  const glassyInputStr = "w-full rounded-xl border-gray-200 bg-white/50 dark:bg-black/20 focus:bg-white transition-all p-3.5 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none shadow-sm font-medium";
  const glassyLabelStr = "text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 mb-1.5 block";

  return (
    <div className="relative group animate-slide-up">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-10 group-hover:opacity-20 transition duration-500 blur-lg"></div>
      <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">

        <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
              <UserCog className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Set Site Engineer</h3>
              <p className="text-sm text-indigo-600/80 dark:text-indigo-300 font-medium">Site Leadership & Approval Authority</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
            Only one engineer can be assigned to the site. The engineer will have authority to approve labour attendance and manage inventory.
          </p>
        </div>

        <div className="p-6 md:p-8">
          {/* Existing Engineer Display */}
          {existingEngineer && (
            <div className="mb-0">
              <div className="bg-green-50/80 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900 dark:text-green-100">Engineer Already Assigned</h4>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-green-700/70 uppercase font-semibold">Name</p>
                        <p className="font-medium text-green-900 dark:text-green-100 text-lg">{existingEngineer.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700/70 uppercase font-semibold">ID</p>
                        <p className="font-medium text-green-900 dark:text-green-100 text-lg">{existingEngineer.id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700/70 uppercase font-semibold">Added On</p>
                        <p className="font-medium text-green-900 dark:text-green-100 text-lg">{new Date(existingEngineer.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-200 max-w-lg">
                  <span className="font-bold">Note:</span> To assign a new engineer, you must first remove the current one. This will revoke their access immediately.
                </p>

                <Button
                  onClick={handleDeleteEngineer}
                  disabled={isDeleting}
                  variant="destructive"
                  className="shrink-0 bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Engineer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Add Engineer Form - Only show if no engineer exists */}
          {!existingEngineer && (
            <>
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label htmlFor="eng-fullName" className={glassyLabelStr}>Full Name</label>
                    <input
                      id="eng-fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isSubmitting || isDeleting}
                      className={glassyInputStr}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="eng-email" className={glassyLabelStr}>Email Address</label>
                    <input
                      id="eng-email"
                      type="email"
                      placeholder="engineer@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting || isDeleting}
                      className={glassyInputStr}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="eng-phone" className={glassyLabelStr}>Phone (10 digits)</label>
                    <input
                      id="eng-phone"
                      type="text"
                      placeholder="1234567890"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      disabled={isSubmitting || isDeleting}
                      className={glassyInputStr}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="eng-password" className={glassyLabelStr}>Password (Min 8 chars)</label>
                    <input
                      id="eng-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting || isDeleting}
                      className={glassyInputStr}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || isDeleting}
                    className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Engineer Account...
                      </>
                    ) : (
                      <>
                        <UserCog className="w-5 h-5 mr-2" />
                        Set as Site Engineer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
