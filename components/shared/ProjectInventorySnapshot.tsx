"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProjectSummary {
    totalProjects: number;
    totalFlats: number;
    soldUnits: number;
    unsoldUnits: number;
    soldPercentage: number;
}

export function ProjectInventorySnapshot() {
    const [summary, setSummary] = useState<ProjectSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/projects");
                const data = await res.json();

                if (data.success && Array.isArray(data.data)) {
                    const projects = data.data;
                    const totalProjects = projects.length;
                    const totalFlats = projects.reduce((acc: number, p: any) => acc + p.total_flats, 0);
                    const soldUnits = projects.reduce((acc: number, p: any) => acc + p.sold_count, 0);
                    const unsoldUnits = projects.reduce((acc: number, p: any) => acc + p.unsold_count, 0);

                    setSummary({
                        totalProjects,
                        totalFlats,
                        soldUnits,
                        unsoldUnits,
                        soldPercentage: totalFlats > 0 ? Math.round((soldUnits / totalFlats) * 100) : 0
                    });
                }
            } catch (error) {
                console.error("Failed to fetch project stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return <Skeleton className="w-full h-[180px] rounded-xl" />;
    }

    if (!summary || summary.totalProjects === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Building2 className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No projects active</p>
                    <Link href="/manager/project-sales">
                        <Button variant="link" className="text-amber-600 px-0">Start Sales Tracking</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="card-premium animate-slide-up">
            <div className="flex flex-row items-center justify-between pb-4 border-b border-border/10 mb-4">
                <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-700">Project Sales Snapshot</h3>
                <Link href="/manager/project-sales" className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1">
                    View Details
                    <TrendingUp className="w-3 h-3" />
                </Link>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Projects</p>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">{summary.totalProjects}</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventory Status</p>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                            <Home className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">{summary.soldUnits}<span className="text-sm text-muted-foreground font-normal">/{summary.totalFlats}</span></span>
                    </div>
                    {/* <p className="text-[10px] text-green-600 font-medium">{summary.soldPercentage}% Sold</p> */}
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Availability</p>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">{summary.unsoldUnits}</span>
                    </div>
                    {/* <p className="text-[10px] text-amber-600 font-medium">Units Left</p> */}
                </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Sales Progress</span>
                    <span className="text-orange-600">{summary.soldPercentage}% Sold</span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden border border-border/20">
                    <div
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                        style={{ width: `${summary.soldPercentage}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>Target: 100%</span>
                </div>
            </div>
        </div>
    );
}