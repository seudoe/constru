"use client";

import { useState } from "react";
import ContractorRatingCard from "./ContractorRatingCard";
import { RatingResult } from "@/types/contractor";
import { useTranslation } from "react-i18next";

export default function RatingSimulator() {
    const { t } = useTranslation();
    const [jsonInput, setJsonInput] = useState<string>(`{
  "tasks": [
    { "id": "t1", "status": "completed", "due_date": "2023-01-01", "updated_at": "2023-01-05" },
    { "id": "t2", "status": "completed", "due_date": "2023-01-10", "updated_at": "2023-01-09" }
  ],
  "defects": [
    { "id": "d1", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-02" }
  ]
}`);
    const [result, setResult] = useState<RatingResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const simulateRating = async () => {
        setLoading(true);
        setError(null);
        try {
            const parsed = JSON.parse(jsonInput);

            // We pass a dummy contractorId just to satisfy the API validation, 
            // but provided tasks/defects will take precedence in logic.
            const payload = {
                contractorId: "simulator-test",
                simulate: true,
                ...parsed
            };

            const res = await fetch("/api/contractors/rate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Simulation failed");

            // The API returns the calculation result directly
            setResult(data);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-xl border border-slate-200">

            {/* Input Side */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('rating_simulator')}</h3>
                    <p className="text-sm text-slate-500">
                        {t('rating_simulator_desc')}
                    </p>
                </div>

                <div className="relative">
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="w-full h-64 p-4 font-mono text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        spellCheck={false}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        Error: {error}
                    </div>
                )}

                <button
                    onClick={simulateRating}
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                    {loading ? t('calculating') : t('simulate_rating')}
                </button>
            </div>

            {/* Output Side */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">{t('result')}</h3>
                <p className="text-sm text-slate-500">
                    {t('result_desc')}
                </p>

                {result ? (
                    // We can render a "Visual Replica" of the card logic here, 
                    // OR standardise the Card to accept props instead of just ID.
                    // For now, let's just make a "Simulated" visual wrapper.
                    <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{t('simulated_rating')}</h3>
                                <p className="text-sm text-slate-500 mt-1">{t('based_on_input_json')}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadgeStyles(result.risk)}`}>
                                {result.risk}
                            </div>
                        </div>

                        <div className="mt-6 flex items-baseline gap-2">
                            <span className={`text-4xl font-bold ${getScoreColor(result.score)}`}>{result.score}</span>
                            <span className="text-slate-400 font-medium">/ 10</span>
                        </div>

                        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">{t('payment_advice')}</h4>
                            <p className="text-sm text-slate-600">{result.advice}</p>
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('reasons')}</h4>
                            <ul className="space-y-1">
                                {result.reasons.map((r, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                        <span className="text-slate-400">•</span> {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center bg-slate-100 rounded-lg dashed border-2 border-slate-300 text-slate-400 text-sm">
                        {t('run_simulation_msg')}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helpers duplicated from Card for standalone simulation view
function getRiskBadgeStyles(risk: string) {
    switch (risk) {
        case "EXCELLENT": return "text-green-600 bg-green-50 border-green-200";
        case "GOOD": return "text-blue-600 bg-blue-50 border-blue-200";
        case "MEDIUM": return "text-yellow-600 bg-yellow-50 border-yellow-200";
        case "HIGH": return "text-orange-600 bg-orange-50 border-orange-200";
        case "CRITICAL": return "text-red-600 bg-red-50 border-red-200";
        default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
}

function getScoreColor(score: number) {
    if (score >= 9) return "text-green-600";
    if (score >= 7) return "text-blue-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
}

export const demoData = {
    "contractors": [
        {
            "contractor_id": "CNT001",
            "name": "Reliable Builders",
            "location": "Mumbai, Maharashtra",
            "establishment_year": 2010,
            "rating": 4.2,
            "total_projects": 156,
            "specialization": ["Residential", "Commercial", "Infrastructure"],
            "certifications": ["ISO 9001:2015", "RERA Registered"],
            "tasks": [
                { "id": "RB_T001", "project": "Andheri Residential Complex", "status": "completed", "due_date": "2023-01-15", "updated_at": "2023-01-14", "delay_days": 0, "location": "Andheri West, Mumbai" },
                { "id": "RB_T002", "project": "Bandra Office Tower", "status": "completed", "due_date": "2023-01-20", "updated_at": "2023-01-25", "delay_days": 5, "location": "Bandra East, Mumbai" },
                { "id": "RB_T003", "project": "Powai IT Park Phase 2", "status": "in_progress", "due_date": "2023-02-01", "updated_at": "2023-01-28", "delay_days": 0, "location": "Powai, Mumbai" },
                { "id": "RB_T004", "project": "Thane Metro Station", "status": "completed", "due_date": "2023-01-10", "updated_at": "2023-01-09", "delay_days": -1, "location": "Thane West, Maharashtra" },
                { "id": "RB_T005", "project": "Navi Mumbai Housing Society", "status": "completed", "due_date": "2023-01-25", "updated_at": "2023-01-27", "delay_days": 2, "location": "Vashi, Navi Mumbai" },
                { "id": "RB_T006", "project": "Goregaon Mall Extension", "status": "in_progress", "due_date": "2023-02-10", "updated_at": "2023-01-30", "delay_days": 0, "location": "Goregaon East, Mumbai" },
                { "id": "RB_T007", "project": "Borivali Flyover", "status": "completed", "due_date": "2023-01-18", "updated_at": "2023-01-20", "delay_days": 2, "location": "Borivali West, Mumbai" },
                { "id": "RB_T008", "project": "Dadar School Building", "status": "completed", "due_date": "2023-01-12", "updated_at": "2023-01-11", "delay_days": -1, "location": "Dadar East, Mumbai" },
                { "id": "RB_T009", "project": "Kurla Hospital Wing", "status": "pending", "due_date": "2023-02-05", "updated_at": "2023-01-29", "delay_days": 0, "location": "Kurla West, Mumbai" },
                { "id": "RB_T010", "project": "Malad Warehouse Complex", "status": "completed", "due_date": "2023-01-22", "updated_at": "2023-01-28", "delay_days": 6, "location": "Malad West, Mumbai" },
                { "id": "RB_T011", "project": "Worli Sea Link Maintenance", "status": "completed", "due_date": "2023-01-08", "updated_at": "2023-01-08", "delay_days": 0, "location": "Worli, Mumbai" },
                { "id": "RB_T012", "project": "Santacruz Airport Area Development", "status": "in_progress", "due_date": "2023-02-15", "updated_at": "2023-01-31", "delay_days": 0, "location": "Santacruz East, Mumbai" },
                { "id": "RB_T013", "project": "Kalyan Smart City Infrastructure", "status": "completed", "due_date": "2023-01-30", "updated_at": "2023-02-02", "delay_days": 3, "location": "Kalyan, Maharashtra" },
                { "id": "RB_T014", "project": "Churchgate Station Renovation", "status": "completed", "due_date": "2023-01-16", "updated_at": "2023-01-15", "delay_days": -1, "location": "Churchgate, Mumbai" },
                { "id": "RB_T015", "project": "Vasai Road Overbridge", "status": "in_progress", "due_date": "2023-02-20", "updated_at": "2023-02-01", "delay_days": 0, "location": "Vasai, Maharashtra" },
                { "id": "RB_T016", "project": "Mulund Residential Tower", "status": "completed", "due_date": "2023-01-24", "updated_at": "2023-01-26", "delay_days": 2, "location": "Mulund West, Mumbai" },
                { "id": "RB_T017", "project": "Ghatkopar Metro Parking", "status": "completed", "due_date": "2023-01-14", "updated_at": "2023-01-14", "delay_days": 0, "location": "Ghatkopar East, Mumbai" },
                { "id": "RB_T018", "project": "Chembur Shopping Complex", "status": "pending", "due_date": "2023-02-08", "updated_at": "2023-01-30", "delay_days": 0, "location": "Chembur, Mumbai" },
                { "id": "RB_T019", "project": "Vikhroli Factory Shed", "status": "completed", "due_date": "2023-01-19", "updated_at": "2023-01-21", "delay_days": 2, "location": "Vikhroli East, Mumbai" },
                { "id": "RB_T020", "project": "Kandivali Sports Complex", "status": "completed", "due_date": "2023-01-11", "updated_at": "2023-01-10", "delay_days": -1, "location": "Kandivali West, Mumbai" },
                { "id": "RB_T021", "project": "Jogeshwari Link Road", "status": "in_progress", "due_date": "2023-02-12", "updated_at": "2023-02-02", "delay_days": 0, "location": "Jogeshwari West, Mumbai" },
                { "id": "RB_T022", "project": "Dahisar Bridge Repair", "status": "completed", "due_date": "2023-01-17", "updated_at": "2023-01-19", "delay_days": 2, "location": "Dahisar East, Mumbai" },
                { "id": "RB_T023", "project": "Mira Road Housing", "status": "completed", "due_date": "2023-01-26", "updated_at": "2023-01-25", "delay_days": -1, "location": "Mira Road, Maharashtra" },
                { "id": "RB_T024", "project": "Bhayander Station Plaza", "status": "in_progress", "due_date": "2023-02-18", "updated_at": "2023-02-03", "delay_days": 0, "location": "Bhayander, Maharashtra" },
                { "id": "RB_T025", "project": "Virar Coastal Road", "status": "pending", "due_date": "2023-02-25", "updated_at": "2023-02-01", "delay_days": 0, "location": "Virar, Maharashtra" },
                { "id": "RB_T026", "project": "Dombivli Temple Complex", "status": "completed", "due_date": "2023-01-21", "updated_at": "2023-01-23", "delay_days": 2, "location": "Dombivli, Maharashtra" },
                { "id": "RB_T027", "project": "Badlapur Industrial Park", "status": "completed", "due_date": "2023-01-13", "updated_at": "2023-01-13", "delay_days": 0, "location": "Badlapur, Maharashtra" },
                { "id": "RB_T028", "project": "Ambernath Water Tank", "status": "completed", "due_date": "2023-01-09", "updated_at": "2023-01-08", "delay_days": -1, "location": "Ambernath, Maharashtra" },
                { "id": "RB_T029", "project": "Ulhasnagar Market Renovation", "status": "in_progress", "due_date": "2023-02-14", "updated_at": "2023-02-04", "delay_days": 0, "location": "Ulhasnagar, Maharashtra" },
                { "id": "RB_T030", "project": "Panvel IT Hub", "status": "completed", "due_date": "2023-01-28", "updated_at": "2023-01-30", "delay_days": 2, "location": "Panvel, Navi Mumbai" },
                { "id": "RB_T031", "project": "Kharghar Golf Course Clubhouse", "status": "completed", "due_date": "2023-01-23", "updated_at": "2023-01-22", "delay_days": -1, "location": "Kharghar, Navi Mumbai" },
                { "id": "RB_T032", "project": "Belapur CBD Office", "status": "in_progress", "due_date": "2023-02-22", "updated_at": "2023-02-05", "delay_days": 0, "location": "Belapur, Navi Mumbai" },
                { "id": "RB_T033", "project": "Airoli Bridge", "status": "completed", "due_date": "2023-01-27", "updated_at": "2023-01-29", "delay_days": 2, "location": "Airoli, Navi Mumbai" },
                { "id": "RB_T034", "project": "Ghansoli Metro Connector", "status": "pending", "due_date": "2023-02-28", "updated_at": "2023-02-06", "delay_days": 0, "location": "Ghansoli, Navi Mumbai" },
                { "id": "RB_T035", "project": "Koparkhairane Hospital", "status": "completed", "due_date": "2023-01-15", "updated_at": "2023-01-17", "delay_days": 2, "location": "Koparkhairane, Navi Mumbai" },
                { "id": "RB_T036", "project": "Turbhe MIDC Phase 3", "status": "completed", "due_date": "2023-01-20", "updated_at": "2023-01-19", "delay_days": -1, "location": "Turbhe, Navi Mumbai" },
                { "id": "RB_T037", "project": "Sanpada Railway Station", "status": "in_progress", "due_date": "2023-02-16", "updated_at": "2023-02-07", "delay_days": 0, "location": "Sanpada, Navi Mumbai" },
                { "id": "RB_T038", "project": "Juinagar Garden Development", "status": "completed", "due_date": "2023-01-12", "updated_at": "2023-01-14", "delay_days": 2, "location": "Juinagar, Navi Mumbai" },
                { "id": "RB_T039", "project": "Nerul Wholesale Market", "status": "completed", "due_date": "2023-01-18", "updated_at": "2023-01-17", "delay_days": -1, "location": "Nerul, Navi Mumbai" },
                { "id": "RB_T040", "project": "Seawoods Mall Expansion", "status": "in_progress", "due_date": "2023-02-19", "updated_at": "2023-02-08", "delay_days": 0, "location": "Seawoods, Navi Mumbai" },
                { "id": "RB_T041", "project": "Boisar Industrial Estate", "status": "completed", "due_date": "2023-01-25", "updated_at": "2023-01-27", "delay_days": 2, "location": "Boisar, Maharashtra" },
                { "id": "RB_T042", "project": "Manor Bypass Road", "status": "completed", "due_date": "2023-01-10", "updated_at": "2023-01-09", "delay_days": -1, "location": "Manor, Maharashtra" },
                { "id": "RB_T043", "project": "Palghar District Court", "status": "pending", "due_date": "2023-03-01", "updated_at": "2023-02-09", "delay_days": 0, "location": "Palghar, Maharashtra" },
                { "id": "RB_T044", "project": "Alibaug Beach Resort", "status": "completed", "due_date": "2023-01-22", "updated_at": "2023-01-24", "delay_days": 2, "location": "Alibaug, Maharashtra" },
                { "id": "RB_T045", "project": "Pen Railway Overbridge", "status": "completed", "due_date": "2023-01-16", "updated_at": "2023-01-16", "delay_days": 0, "location": "Pen, Maharashtra" },
                { "id": "RB_T046", "project": "Karjat Hill Station Road", "status": "in_progress", "due_date": "2023-02-21", "updated_at": "2023-02-10", "delay_days": 0, "location": "Karjat, Maharashtra" },
                { "id": "RB_T047", "project": "Lonavala Highway Widening", "status": "completed", "due_date": "2023-01-29", "updated_at": "2023-01-31", "delay_days": 2, "location": "Lonavala, Maharashtra" },
                { "id": "RB_T048", "project": "Khandala Tourist Center", "status": "completed", "due_date": "2023-01-14", "updated_at": "2023-01-13", "delay_days": -1, "location": "Khandala, Maharashtra" },
                { "id": "RB_T049", "project": "Pune-Mumbai Expressway Toll", "status": "in_progress", "due_date": "2023-02-24", "updated_at": "2023-02-11", "delay_days": 0, "location": "Pune, Maharashtra" },
                { "id": "RB_T050", "project": "Talegaon MIDC Unit", "status": "completed", "due_date": "2023-01-19", "updated_at": "2023-01-21", "delay_days": 2, "location": "Talegaon, Maharashtra" },
                { "id": "RB_T051", "project": "Chakan Auto Hub", "status": "completed", "due_date": "2023-01-11", "updated_at": "2023-01-10", "delay_days": -1, "location": "Chakan, Maharashtra" },
                { "id": "RB_T052", "project": "Hinjewadi IT Park Phase 4", "status": "pending", "due_date": "2023-02-27", "updated_at": "2023-02-12", "delay_days": 0, "location": "Hinjewadi, Pune" },
                { "id": "RB_T053", "project": "Kharadi Corporate Park", "status": "completed", "due_date": "2023-01-24", "updated_at": "2023-01-26", "delay_days": 2, "location": "Kharadi, Pune" },
                { "id": "RB_T054", "project": "Viman Nagar Commercial Complex", "status": "completed", "due_date": "2023-01-17", "updated_at": "2023-01-16", "delay_days": -1, "location": "Viman Nagar, Pune" },
                { "id": "RB_T055", "project": "Koregaon Park Hotel", "status": "in_progress", "due_date": "2023-02-17", "updated_at": "2023-02-13", "delay_days": 0, "location": "Koregaon Park, Pune" },
                { "id": "RB_T056", "project": "Hadapsar Pharma Plant", "status": "completed", "due_date": "2023-01-26", "updated_at": "2023-01-28", "delay_days": 2, "location": "Hadapsar, Pune" },
                { "id": "RB_T057", "project": "Magarpatta City Phase 5", "status": "completed", "due_date": "2023-01-13", "updated_at": "2023-01-13", "delay_days": 0, "location": "Magarpatta, Pune" },
                { "id": "RB_T058", "project": "Aundh Metro Station", "status": "in_progress", "due_date": "2023-02-23", "updated_at": "2023-02-14", "delay_days": 0, "location": "Aundh, Pune" },
                { "id": "RB_T059", "project": "Baner Housing Society", "status": "completed", "due_date": "2023-01-21", "updated_at": "2023-01-23", "delay_days": 2, "location": "Baner, Pune" },
                { "id": "RB_T060", "project": "Pashan Engineering College", "status": "completed", "due_date": "2023-01-08", "updated_at": "2023-01-07", "delay_days": -1, "location": "Pashan, Pune" },
                { "id": "RB_T061", "project": "Wakad IT Building", "status": "pending", "due_date": "2023-03-05", "updated_at": "2023-02-15", "delay_days": 0, "location": "Wakad, Pune" },
                { "id": "RB_T062", "project": "Pimpri-Chinchwad Smart Road", "status": "completed", "due_date": "2023-01-27", "updated_at": "2023-01-29", "delay_days": 2, "location": "Pimpri, Pune" },
                { "id": "RB_T063", "project": "Nigdi Railway Station Upgr", "status": "completed", "due_date": "2023-01-15", "updated_at": "2023-01-14", "delay_days": -1, "location": "Nigdi, Pune" },
                { "id": "RB_T064", "project": "Akurdi Bus Depot", "status": "in_progress", "due_date": "2023-02-26", "updated_at": "2023-02-16", "delay_days": 0, "location": "Akurdi, Pune" },
                { "id": "RB_T065", "project": "Chinchwad Mall Food Court", "status": "completed", "due_date": "2023-01-20", "updated_at": "2023-01-22", "delay_days": 2, "location": "Chinchwad, Pune" },
                { "id": "RB_T066", "project": "Bhosari Industrial Unit", "status": "completed", "due_date": "2023-01-12", "updated_at": "2023-01-11", "delay_days": -1, "location": "Bhosari, Pune" },
                { "id": "RB_T067", "project": "Kalewadi Phata Flyover", "status": "in_progress", "due_date": "2023-02-20", "updated_at": "2023-02-17", "delay_days": 0, "location": "Kalewadi, Pune" },
                { "id": "RB_T068", "project": "Ravet Sports Stadium", "status": "completed", "due_date": "2023-01-28", "updated_at": "2023-01-30", "delay_days": 2, "location": "Ravet, Pune" },
                { "id": "RB_T069", "project": "Tathawade Tech Park", "status": "completed", "due_date": "2023-01-16", "updated_at": "2023-01-15", "delay_days": -1, "location": "Tathawade, Pune" },
                { "id": "RB_T070", "project": "Phulewadi Hospital Wing", "status": "pending", "due_date": "2023-03-02", "updated_at": "2023-02-18", "delay_days": 0, "location": "Phulewadi, Pune" },
                { "id": "RB_T071", "project": "Vishal Nagar Housing", "status": "completed", "due_date": "2023-01-23", "updated_at": "2023-01-25", "delay_days": 2, "location": "Vishal Nagar, Pune" },
                { "id": "RB_T072", "project": "Shivajinagar Metro Plaza", "status": "completed", "due_date": "2023-01-09", "updated_at": "2023-01-08", "delay_days": -1, "location": "Shivajinagar, Pune" },
                { "id": "RB_T073", "project": "Deccan Gymkhana Parking", "status": "in_progress", "due_date": "2023-02-15", "updated_at": "2023-02-19", "delay_days": 0, "location": "Deccan, Pune" },
                { "id": "RB_T074", "project": "Swargate Bus Terminal", "status": "completed", "due_date": "2023-01-30", "updated_at": "2023-02-01", "delay_days": 2, "location": "Swargate, Pune" },
                { "id": "RB_T075", "project": "Katraj Dairy Farm", "status": "completed", "due_date": "2023-01-14", "updated_at": "2023-01-13", "delay_days": -1, "location": "Katraj, Pune" },
                { "id": "RB_T076", "project": "Bibvewadi School Building", "status": "in_progress", "due_date": "2023-02-29", "updated_at": "2023-02-20", "delay_days": 0, "location": "Bibvewadi, Pune" },
                { "id": "RB_T077", "project": "Dhankawadi Water Treatment", "status": "completed", "due_date": "2023-01-18", "updated_at": "2023-01-20", "delay_days": 2, "location": "Dhankawadi, Pune" },
                { "id": "RB_T078", "project": "Warje Bridge Repair", "status": "completed", "due_date": "2023-01-11", "updated_at": "2023-01-10", "delay_days": -1, "location": "Warje, Pune" },
                { "id": "RB_T079", "project": "Kothrud Residential Tower", "status": "pending", "due_date": "2023-03-08", "updated_at": "2023-02-21", "delay_days": 0, "location": "Kothrud, Pune" },
                { "id": "RB_T080", "project": "Karve Nagar Community Hall", "status": "completed", "due_date": "2023-01-25", "updated_at": "2023-01-27", "delay_days": 2, "location": "Karve Nagar, Pune" },
                { "id": "RB_T081", "project": "Erandwane Shopping Center", "status": "completed", "due_date": "2023-01-17", "updated_at": "2023-01-16", "delay_days": -1, "location": "Erandwane, Pune" },
                { "id": "RB_T082", "project": "Parvati Hill Temple Path", "status": "in_progress", "due_date": "2023-02-18", "updated_at": "2023-02-22", "delay_days": 0, "location": "Parvati, Pune" },
                { "id": "RB_T083", "project": "Sahakar Nagar Market", "status": "completed", "due_date": "2023-01-22", "updated_at": "2023-01-24", "delay_days": 2, "location": "Sahakar Nagar, Pune" },
                { "id": "RB_T084", "project": "Khadki Cantonment Road", "status": "completed", "due_date": "2023-01-10", "updated_at": "2023-01-09", "delay_days": -1, "location": "Khadki, Pune" },
                { "id": "RB_T085", "project": "Dapodi Railway Bridge", "status": "in_progress", "due_date": "2023-03-01", "updated_at": "2023-02-23", "delay_days": 0, "location": "Dapodi, Pune" },
                { "id": "RB_T086", "project": "Kasarwadi MIDC Expansion", "status": "completed", "due_date": "2023-01-29", "updated_at": "2023-01-31", "delay_days": 2, "location": "Kasarwadi, Pune" },
                { "id": "RB_T087", "project": "Yerawada Jail Road", "status": "completed", "due_date": "2023-01-13", "updated_at": "2023-01-12", "delay_days": -1, "location": "Yerawada, Pune" },
                { "id": "RB_T088", "project": "Kalyani Nagar Club House", "status": "pending", "due_date": "2023-03-10", "updated_at": "2023-02-24", "delay_days": 0, "location": "Kalyani Nagar, Pune" },
                { "id": "RB_T089", "project": "Wadgaon Sheri IT Campus", "status": "completed", "due_date": "2023-01-24", "updated_at": "2023-01-26", "delay_days": 2, "location": "Wadgaon Sheri, Pune" },
                { "id": "RB_T090", "project": "Mundwa Chowk Flyover", "status": "completed", "due_date": "2023-01-15", "updated_at": "2023-01-14", "delay_days": -1, "location": "Mundwa, Pune" },
                { "id": "RB_T091", "project": "Lohegaon Airport Link Road", "status": "in_progress", "due_date": "2023-02-25", "updated_at": "2023-02-25", "delay_days": 0, "location": "Lohegaon, Pune" },
                { "id": "RB_T092", "project": "Wagholi IT Building", "status": "completed", "due_date": "2023-01-19", "updated_at": "2023-01-21", "delay_days": 2, "location": "Wagholi, Pune" },
                { "id": "RB_T093", "project": "Manjri Housing Complex", "status": "completed", "due_date": "2023-01-12", "updated_at": "2023-01-11", "delay_days": -1, "location": "Manjri, Pune" },
                { "id": "RB_T094", "project": "Fursungi Warehouse", "status": "in_progress", "due_date": "2023-03-05", "updated_at": "2023-02-26", "delay_days": 0, "location": "Fursungi, Pune" },
                { "id": "RB_T095", "project": "Undri Smart City Phase 1", "status": "completed", "due_date": "2023-01-26", "updated_at": "2023-01-28", "delay_days": 2, "location": "Undri, Pune" },
                { "id": "RB_T096", "project": "Kondhwa Hospital", "status": "completed", "due_date": "2023-01-16", "updated_at": "2023-01-15", "delay_days": -1, "location": "Kondhwa, Pune" },
                { "id": "RB_T097", "project": "Wanowrie School Campus", "status": "pending", "due_date": "2023-03-12", "updated_at": "2023-02-27", "delay_days": 0, "location": "Wanowrie, Pune" },
                { "id": "RB_T098", "project": "Salisbury Park Community Ctr", "status": "completed", "due_date": "2023-01-21", "updated_at": "2023-01-23", "delay_days": 2, "location": "Salisbury Park, Pune" },
                { "id": "RB_T099", "project": "NIBM Road Office Complex", "status": "completed", "due_date": "2023-01-09", "updated_at": "2023-01-08", "delay_days": -1, "location": "NIBM, Pune" },
                { "id": "RB_T100", "project": "Mohammed Wadi Metro Conn", "status": "in_progress", "due_date": "2023-02-28", "updated_at": "2023-02-28", "delay_days": 0, "location": "Mohammed Wadi, Pune" }
            ],
            "defects": [
                { "id": "RB_D001", "task_id": "RB_T002", "severity": "MEDIUM", "status": "RESOLVED", "created_at": "2023-01-22", "resolved_at": "2023-01-24", "description": "Concrete curing issue in basement", "cost_impact": 45000 },
                { "id": "RB_D002", "task_id": "RB_T005", "severity": "HIGH", "status": "OPEN", "created_at": "2023-01-25", "resolved_at": null, "description": "Electrical wiring fault in main panel", "cost_impact": 25000 },
                { "id": "RB_D003", "task_id": "RB_T010", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-28", "resolved_at": "2023-01-30", "description": "Plumbing leak in bathroom", "cost_impact": 15000 },
                { "id": "RB_D004", "task_id": "RB_T015", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-02-01", "resolved_at": null, "description": "Cracks in foundation wall", "cost_impact": 40000 },
                { "id": "RB_D005", "task_id": "RB_T020", "severity": "CRITICAL", "status": "OPEN", "created_at": "2023-01-10", "resolved_at": null, "description": "Structural beam misalignment", "cost_impact": 80000 },
                { "id": "RB_D006", "task_id": "RB_T025", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-02-01", "resolved_at": "2023-02-03", "description": "Paint peeling on exterior wall", "cost_impact": 5000 },
                { "id": "RB_D007", "task_id": "RB_T030", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-30", "resolved_at": null, "description": "HVAC system malfunction", "cost_impact": 35000 },
                { "id": "RB_D008", "task_id": "RB_T035", "severity": "HIGH", "status": "RESOLVED", "created_at": "2023-01-17", "resolved_at": "2023-01-19", "description": "Roof leakage during rain", "cost_impact": 20000 },
                { "id": "RB_D009", "task_id": "RB_T040", "severity": "CRITICAL", "status": "OPEN", "created_at": "2023-02-08", "resolved_at": null, "description": "Elevator safety failure", "cost_impact": 95000 },
                { "id": "RB_D010", "task_id": "RB_T045", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-16", "resolved_at": "2023-01-18", "description": "Door hinge loose", "cost_impact": 2000 },
                { "id": "RB_D011", "task_id": "RB_T050", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-21", "resolved_at": null, "description": "Water seepage in basement", "cost_impact": 30000 },
                { "id": "RB_D012", "task_id": "RB_T055", "severity": "HIGH", "status": "OPEN", "created_at": "2023-02-13", "resolved_at": null, "description": "Fire alarm system error", "cost_impact": 18000 },
                { "id": "RB_D013", "task_id": "RB_T060", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-01-07", "resolved_at": "2023-01-10", "description": "Foundation settlement", "cost_impact": 70000 },
                { "id": "RB_D014", "task_id": "RB_T065", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-22", "resolved_at": "2023-01-24", "description": "Tile grout cracking", "cost_impact": 8000 },
                { "id": "RB_D015", "task_id": "RB_T070", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-02-18", "resolved_at": null, "description": "Insulation damage", "cost_impact": 22000 },
                { "id": "RB_D016", "task_id": "RB_T075", "severity": "HIGH", "status": "OPEN", "created_at": "2023-01-13", "resolved_at": null, "description": "Window seal failure", "cost_impact": 12000 },
                { "id": "RB_D017", "task_id": "RB_T080", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-01-27", "resolved_at": "2023-02-01", "description": "Load bearing wall crack", "cost_impact": 60000 },
                { "id": "RB_D018", "task_id": "RB_T085", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-02-23", "resolved_at": "2023-02-25", "description": "Cabinet door misalignment", "cost_impact": 3000 },
                { "id": "RB_D019", "task_id": "RB_T090", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-14", "resolved_at": null, "description": "Drainage blockage", "cost_impact": 15000 },
                { "id": "RB_D020", "task_id": "RB_T095", "severity": "HIGH", "status": "OPEN", "created_at": "2023-01-28", "resolved_at": null, "description": "Circuit breaker tripping", "cost_impact": 10000 },
                { "id": "RB_D021", "task_id": "RB_T100", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-02-28", "resolved_at": "2023-03-02", "description": "Metro connection structural issue", "cost_impact": 85000 },
                { "id": "RB_D022", "task_id": "RB_T001", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-14", "resolved_at": "2023-01-16", "description": "Minor paint scratch", "cost_impact": 1000 },
                { "id": "RB_D023", "task_id": "RB_T006", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-30", "resolved_at": null, "description": "Air conditioning leak", "cost_impact": 28000 },
                { "id": "RB_D024", "task_id": "RB_T011", "severity": "HIGH", "status": "OPEN", "created_at": "2023-01-08", "resolved_at": null, "description": "Sea link maintenance delay", "cost_impact": 50000 },
                { "id": "RB_D025", "task_id": "RB_T016", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-01-26", "resolved_at": "2023-01-29", "description": "Tower foundation shift", "cost_impact": 75000 },
                { "id": "RB_D026", "task_id": "RB_T021", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-02-02", "resolved_at": "2023-02-04", "description": "Link road pothole", "cost_impact": 5000 },
                { "id": "RB_D027", "task_id": "RB_T026", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-23", "resolved_at": null, "description": "Temple complex drainage", "cost_impact": 20000 },
                { "id": "RB_D028", "task_id": "RB_T031", "severity": "HIGH", "status": "OPEN", "created_at": "2023-01-22", "resolved_at": null, "description": "Golf course irrigation failure", "cost_impact": 30000 },
                { "id": "RB_D029", "task_id": "RB_T036", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-01-19", "resolved_at": "2023-01-22", "description": "MIDC phase structural flaw", "cost_impact": 90000 },
                { "id": "RB_D030", "task_id": "RB_T041", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-27", "resolved_at": "2023-01-29", "description": "Industrial estate fence damage", "cost_impact": 7000 },
                { "id": "RB_D031", "task_id": "RB_T046", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-02-10", "resolved_at": null, "description": "Hill station road erosion", "cost_impact": 25000 },
                { "id": "RB_D032", "task_id": "RB_T051", "severity": "HIGH", "status": "OPEN", "created_at": "2023-01-10", "resolved_at": null, "description": "Auto hub wiring issue", "cost_impact": 15000 },
                { "id": "RB_D033", "task_id": "RB_T056", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-01-28", "resolved_at": "2023-01-31", "description": "Pharma plant contamination", "cost_impact": 65000 },
                { "id": "RB_D034", "task_id": "RB_T061", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-02-15", "resolved_at": "2023-02-17", "description": "IT building carpet stain", "cost_impact": 2000 },
                { "id": "RB_D035", "task_id": "RB_T066", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-11", "resolved_at": null, "description": "Industrial unit ventilation", "cost_impact": 18000 },
                { "id": "RB_D036", "task_id": "RB_T071", "severity": "HIGH", "status": "OPEN", "created_at": "2023-01-25", "resolved_at": null, "description": "Housing complex plumbing", "cost_impact": 22000 },
                { "id": "RB_D037", "task_id": "RB_T076", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-02-20", "resolved_at": "2023-02-23", "description": "School building foundation", "cost_impact": 55000 },
                { "id": "RB_D038", "task_id": "RB_T081", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-16", "resolved_at": "2023-01-18", "description": "Shopping center sign loose", "cost_impact": 3000 },
                { "id": "RB_D039", "task_id": "RB_T086", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-31", "resolved_at": null, "description": "MIDC expansion wiring", "cost_impact": 27000 },
                { "id": "RB_D040", "task_id": "RB_T091", "severity": "HIGH", "status": "OPEN", "created_at": "2023-02-25", "resolved_at": null, "description": "Airport link road crack", "cost_impact": 35000 },
                { "id": "RB_D041", "task_id": "RB_T096", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-01-15", "resolved_at": "2023-01-18", "description": "Hospital electrical failure", "cost_impact": 48000 },
                { "id": "RB_D042", "task_id": "RB_T002", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-25", "resolved_at": "2023-01-27", "description": "Office tower minor leak", "cost_impact": 6000 },
                { "id": "RB_D043", "task_id": "RB_T007", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-20", "resolved_at": null, "description": "Flyover railing damage", "cost_impact": 19000 },
                { "id": "RB_D044", "task_id": "RB_T012", "severity": "HIGH", "status": "OPEN", "created_at": "2023-01-31", "resolved_at": null, "description": "Airport development drainage", "cost_impact": 42000 },
                { "id": "RB_D045", "task_id": "RB_T017", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-01-14", "resolved_at": "2023-01-17", "description": "Metro parking collapse risk", "cost_impact": 78000 },
                { "id": "RB_D046", "task_id": "RB_T022", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-19", "resolved_at": "2023-01-21", "description": "Bridge repair paint issue", "cost_impact": 4000 },
                { "id": "RB_D047", "task_id": "RB_T027", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-13", "resolved_at": null, "description": "Industrial park gate", "cost_impact": 14000 },
                { "id": "RB_D048", "task_id": "RB_T032", "severity": "HIGH", "status": "OPEN", "created_at": "2023-02-05", "resolved_at": null, "description": "CBD office elevator", "cost_impact": 56000 },
                { "id": "RB_D049", "task_id": "RB_T037", "severity": "CRITICAL", "status": "RESOLVED", "created_at": "2023-02-07", "resolved_at": "2023-02-10", "description": "Railway station platform crack", "cost_impact": 62000 },
                { "id": "RB_D050", "task_id": "RB_T042", "severity": "LOW", "status": "RESOLVED", "created_at": "2023-01-09", "resolved_at": "2023-01-11", "description": "Bypass road sign damage", "cost_impact": 2500 },
                { "id": "RB_D051", "task_id": "RB_T047", "severity": "MEDIUM", "status": "IN_PROGRESS", "created_at": "2023-01-31", "resolved_at": null, "description": "Highway widening marking", "cost_impact": 16000 }
            ]
        }
    ]
}
