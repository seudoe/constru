"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Info, ChevronDown, User, AlertTriangle } from "lucide-react";
import { ContractorRating } from "@/types/contractor";
import { createClient } from "@/lib/supabase-browser";
import { useTranslation } from "react-i18next";

interface Props {
    contractorId?: string;
}

interface ContractorSummary {
    id: string;
    name: string;
}

export default function ContractorRatingCard({ contractorId: propId }: Props) {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState<string>(propId || "");
    const [contractors, setContractors] = useState<ContractorSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState<Partial<ContractorRating> | null>(null);
    const [offendingDefects, setOffendingDefects] = useState<any[]>([]); // New state for details
    const [showDetails, setShowDetails] = useState(true); // Default valid info
    const supabase = createClient();

    // Fetch list of contractors
    useEffect(() => {
        if (!propId) {
            async function fetchContractors() {
                const { data, error } = await supabase
                    .from("contractors")
                    .select("id, name")
                    .order("name");

                if (!error && data) {
                    setContractors(data);
                    if (data.length > 0 && !selectedId) {
                        setSelectedId(data[0].id);
                    }
                }
            }
            fetchContractors();
        } else {
            setSelectedId(propId);
        }
    }, [propId]);

    // Fetch rating logic
    useEffect(() => {
        async function fetchRating() {
            if (!selectedId) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/contractors/rate?id=${selectedId}`);
                const data = await res.json();

                setOffendingDefects([]); // clear

                if (data.details) {
                    setRating(data.details);
                } else if (data.current_rating !== undefined) {
                    // If we have a current rating, we still might want "reasons" or "details"
                    // but GET /rate only returns Summary from History Table if available.
                    // To get FRESH details, we should probably trigger a calc or 
                    // the API should return recent defects naturally.
                    // For now, let's use what we have.
                    setRating({
                        score: data.current_rating,
                        risk: "GOOD", // Placeholder
                        advice: "Manual review recommended.",
                        reasons: []
                    });

                    // If we want details, we should trigger a fresh calc or fetch.
                    // For UX, let's trigger a fresh calc silently or on demand to get the list?
                    // Actually, let's just make the user click "Generate" if null,
                    // but if data exists, we show it. 
                    // If `details` was returned (from history), we use it.
                    // Note: history 'reasons' is JSONB, but doesn't store full defect objects usually.
                    // But I updated 'reasons' strings to be descriptive.
                    // The API POST returns `offending_defects` in response. GET doesn't unless I added it.
                    // Let's assume the user triggers generation to see fresh details.
                } else {
                    setRating(null);
                }
            } catch (err) {
                console.error("Failed to fetch rating:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchRating();
    }, [selectedId]);

    const handleGenerate = async () => {
        if (!selectedId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/contractors/rate', {
                method: 'POST',
                body: JSON.stringify({ contractorId: selectedId })
            });
            const newData = await res.json();
            setRating(newData);
            if (newData.offending_defects) {
                setOffendingDefects(newData.offending_defects);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const getRiskColor = (risk?: string) => {
        switch (risk) {
            case "EXCELLENT": return "text-green-700 bg-green-100 border-green-200";
            case "GOOD": return "text-blue-700 bg-blue-100 border-blue-200";
            case "MEDIUM": return "text-yellow-700 bg-yellow-100 border-yellow-200";
            case "HIGH": return "text-orange-700 bg-orange-100 border-orange-200";
            case "CRITICAL": return "text-red-700 bg-red-100 border-red-200";
            default: return "text-muted-foreground bg-secondary border-border";
        }
    };

    const scoreColor = rating?.score && rating.score >= 7 ? "text-green-600" : rating?.score && rating.score >= 5 ? "text-yellow-600" : "text-red-600";

    return (
        <div className="space-y-6">
            <div className="card-premium animate-slide-up">
                <div className="">
                    {/* Header & Selector */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 mr-4">
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-700 mb-2">{t('performance_rating')}</h3>
                            {!propId ? (
                                <div className="mt-2 relative max-w-sm">
                                    <select
                                        value={selectedId}
                                        onChange={(e) => setSelectedId(e.target.value)}
                                        className="appearance-none w-full bg-white/50 border border-input/50 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                                    >
                                        {contractors.length === 0 && <option value="">{t('loading_contractors')}</option>}
                                        {contractors.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground font-medium">{t('based_on_tasks_defects')}</p>
                            )}
                        </div>

                        {loading ? (
                            <div className="px-3 py-1 bg-secondary rounded-full text-xs font-bold text-muted-foreground animate-pulse">{t('calculating')}</div>
                        ) : rating ? (
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${getRiskColor(rating.risk)}`}>
                                {rating.risk || "UNKNOWN"}
                            </div>
                        ) : null}
                    </div>

                    {/* Body */}
                    {loading ? (
                        <div className="animate-pulse space-y-4 py-4">
                            <div className="h-12 w-32 bg-secondary/50 rounded-xl"></div>
                            <div className="h-24 bg-secondary/30 rounded-xl"></div>
                        </div>
                    ) : !rating ? (
                        <div className="text-center py-10 bg-white/30 rounded-xl border border-dashed border-border/50">
                            <div className="p-3 bg-white/50 rounded-full inline-block mb-3">
                                <User className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                            <p className="text-muted-foreground font-medium">{t('no_recent_rating')}</p>
                            {selectedId && (
                                <button
                                    className="mt-4 btn-premium text-sm"
                                    onClick={handleGenerate}
                                >
                                    {t('calculate_now')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between bg-white/40 p-6 rounded-2xl border border-white/40 shadow-sm backdrop-blur-sm">
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-6xl font-black ${scoreColor} drop-shadow-sm`}>{rating.score}</span>
                                    <span className="text-muted-foreground font-medium text-xl">/ 10</span>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    className="btn-ghost-premium text-xs border border-border/50 bg-white/50"
                                >
                                    {t('recalculate')}
                                </button>
                            </div>

                            <div className="mt-6 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    {t('payment_advice')}
                                </h4>
                                <p className="text-sm text-blue-800 font-medium leading-relaxed">{rating.advice}</p>
                                <div className="mt-4 space-y-2">
                                    {rating.reasons?.map((r, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-blue-700/80">
                                            <span className="mt-1 w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                            <span>{r}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Detailed Defect List (Only if offending defects provided) */}
            {offendingDefects.length > 0 && (
                <div className="card-premium animate-slide-up animation-delay-200">
                    <div className="pb-4 border-b border-border/10 mb-2">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            {t('contributing_defects')}
                        </h4>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {offendingDefects.map((defect) => (
                            <div key={defect.id} className="glass-hover p-4 rounded-xl border border-transparent transition-all">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{defect.description || t('unspecified_defect')}</p>
                                        <p className="text-xs text-muted-foreground mt-1.5 font-medium flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                                            {t('logged')} {new Date(defect.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 flex-shrink-0 text-[10px] font-bold uppercase tracking-wide rounded-lg border ${defect.severity === "HIGH" ? "bg-red-100 text-red-700 border-red-200" :
                                        defect.severity === "MEDIUM" ? "bg-orange-100 text-orange-700 border-orange-200" :
                                            "bg-yellow-100 text-yellow-700 border-yellow-200"
                                        }`}>
                                        {defect.severity}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
