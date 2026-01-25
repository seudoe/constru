// components/shared/AddWorkerForm.tsx
"use client";

import { useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, AlertCircle, CheckCircle, UserCog } from "lucide-react";

// Props to customize role options based on who is adding
interface AddWorkerFormProps {
  allowedRoles?: ("engineer" | "labour")[];
  showEngineerAssignment?: boolean; // Manager can assign engineer to labour
  title?: string;
  subtitle?: string;
}

// Validation schema
const workerSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["engineer", "labour"], {
    errorMap: () => ({ message: "Role must be either engineer or labour" }),
  }),
  assignedEngineer: z.string().optional(),
});

const formSchema = z.object({
  workers: z.array(workerSchema).min(1, "At least one worker is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function AddWorkerForm({
  allowedRoles = ["engineer", "labour"],
  showEngineerAssignment = false,
  title = "Add Workers",
  subtitle = "Register new team members",
}: AddWorkerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const defaultRole = allowedRoles.includes("labour") ? "labour" : allowedRoles[0];

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workers: [
        {
          email: "",
          fullName: "",
          phone: "",
          password: "",
          role: defaultRole,
          assignedEngineer: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "workers",
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const worker of data.workers) {
        try {
          const res = await fetch("/api/admin/create-worker", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...worker,
              // Map labour to worker for backend compatibility
              role: worker.role === "labour" ? "worker" : worker.role,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            errors.push(`${worker.email}: ${err.error}`);
            continue;
          }

          successCount++;
        } catch (err) {
          errors.push(
            `${worker.email}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }

      if (successCount > 0) {
        setSuccessMessage(
          `Successfully added ${successCount} worker${successCount !== 1 ? "s" : ""}`
        );
        reset();
      }

      if (errors.length > 0) {
        setErrorMessage(
          `Failed to add ${errors.length} worker${errors.length !== 1 ? "s" : ""}: ${errors.join("; ")}`
        );
      }
    } catch (err) {
      setErrorMessage(
        `Error: ${err instanceof Error ? err.message : "Unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            {title}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            append({
              email: "",
              fullName: "",
              phone: "",
              password: "",
              role: defaultRole,
              assignedEngineer: "",
            })
          }
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Another Member
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <Alert className="mb-6 bg-card border-border">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-foreground">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Table Header for Desktop */}
          <div className={`hidden md:grid gap-4 px-4 py-3 bg-secondary rounded-t-lg font-semibold text-foreground text-sm ${showEngineerAssignment ? "md:grid-cols-14" : "md:grid-cols-12"}`}>
            <div className="col-span-2">Full Name</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Password</div>
            <div className="col-span-2">Role</div>
            {showEngineerAssignment && <div className="col-span-2">Assign Engineer</div>}
            <div className="col-span-2">Action</div>
          </div>

          {/* Worker Rows */}
          <div className="space-y-4">
            {fields.map((field, index) => {
              const currentRole = watch(`workers.${index}.role`);
              return (
                <div
                  key={field.id}
                  className="relative group "
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-2xl opacity-10 group-hover:opacity-20 transition duration-500 blur-lg"></div>
                  <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300">

                    {/* Mobile Header */}
                    <div className="md:hidden mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Worker #{index + 1}
                      </h3>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                        <UserCog className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Grid Layout */}
                    <div className={`grid grid-cols-1 gap-6 ${showEngineerAssignment ? "md:grid-cols-14" : "md:grid-cols-12"} items-start`}>
                      {/* Full Name */}
                      <div className="md:col-span-2">
                        <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                          Full Name
                        </label>
                        <input
                          {...register(`workers.${index}.fullName`)}
                          placeholder="John Doe"
                          className="w-full rounded-xl border-gray-200 bg-white/50 dark:bg-black/20 focus:bg-white transition-all p-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none shadow-sm font-medium text-sm"
                        />
                        {errors.workers?.[index]?.fullName && (
                          <p className="text-red-500 text-xs mt-1 font-medium">
                            {errors.workers[index]?.fullName?.message}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="md:col-span-2">
                        <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                          Email
                        </label>
                        <input
                          {...register(`workers.${index}.email`)}
                          type="email"
                          placeholder="john@example.com"
                          className="w-full rounded-xl border-gray-200 bg-white/50 dark:bg-black/20 focus:bg-white transition-all p-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none shadow-sm font-medium text-sm"
                        />
                        {errors.workers?.[index]?.email && (
                          <p className="text-red-500 text-xs mt-1 font-medium">
                            {errors.workers[index]?.email?.message}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="md:col-span-2">
                        <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                          Phone
                        </label>
                        <input
                          {...register(`workers.${index}.phone`)}
                          placeholder="1234567890"
                          maxLength={10}
                          className="w-full rounded-xl border-gray-200 bg-white/50 dark:bg-black/20 focus:bg-white transition-all p-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none shadow-sm font-medium text-sm"
                        />
                        {errors.workers?.[index]?.phone && (
                          <p className="text-red-500 text-xs mt-1 font-medium">
                            {errors.workers[index]?.phone?.message}
                          </p>
                        )}
                      </div>

                      {/* Password */}
                      <div className="md:col-span-2">
                        <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                          Password
                        </label>
                        <input
                          {...register(`workers.${index}.password`)}
                          type="password"
                          placeholder="••••••••"
                          className="w-full rounded-xl border-gray-200 bg-white/50 dark:bg-black/20 focus:bg-white transition-all p-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none shadow-sm font-medium text-sm"
                        />
                        {errors.workers?.[index]?.password && (
                          <p className="text-red-500 text-xs mt-1 font-medium">
                            {errors.workers[index]?.password?.message}
                          </p>
                        )}
                      </div>

                      {/* Role */}
                      <div className="md:col-span-2">
                        <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                          Role
                        </label>
                        <Select
                          value={currentRole || defaultRole}
                          onValueChange={(value) =>
                            setValue(`workers.${index}.role`, value as "engineer" | "labour")
                          }
                        >
                          <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white/50 dark:bg-black/20 focus:bg-white transition-all h-[46px] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none shadow-sm font-medium text-sm">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedRoles.includes("labour") && (
                              <SelectItem value="labour">Labour</SelectItem>
                            )}
                            {allowedRoles.includes("engineer") && (
                              <SelectItem value="engineer">Engineer</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {errors.workers?.[index]?.role && (
                          <p className="text-red-500 text-xs mt-1 font-medium">
                            {errors.workers[index]?.role?.message}
                          </p>
                        )}
                      </div>

                      {/* Assign Engineer (only for Manager adding Labour) */}
                      {showEngineerAssignment && currentRole === "labour" && (
                        <div className="md:col-span-2">
                          <label className="md:hidden text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                            Assign Engineer
                          </label>
                          <input
                            {...register(`workers.${index}.assignedEngineer`)}
                            placeholder="Engineer ID"
                            className="w-full rounded-xl border-gray-200 bg-white/50 dark:bg-black/20 focus:bg-white transition-all p-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none shadow-sm font-medium text-sm"
                          />
                        </div>
                      )}

                      {/* Delete Button */}
                      <div className="md:col-span-2 flex items-center h-full pt-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1 || isLoading}
                          className="w-full md:w-auto rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => reset()}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Adding...
              </div>
            ) : (
              "Add All Workers"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
