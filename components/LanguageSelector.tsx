"use client";

import { useTranslation } from "react-i18next";
import { Check, Globe, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LanguageSelector() {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const languages = [
        {
            code: "en",
            name: "English",
            nativeName: "English",
            subtext: "Default"
        },
        {
            code: "hi",
            name: "Hindi",
            nativeName: "हिंदी",
            subtext: "Indian"
        },
        {
            code: "mr",
            name: "Marathi",
            nativeName: "मराठी",
            subtext: "Regional"
        },
        {
            code: "ta",
            name: "Tamil",
            nativeName: "தமிழ்",
            subtext: "Regional"
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {languages.map((lang, index) => {
                const isActive = i18n.language === lang.code;
                return (
                    <motion.div
                        key={lang.code}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={cn(
                            "relative overflow-hidden cursor-pointer rounded-xl border p-4 transition-colors duration-200",
                            isActive
                                ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-md ring-1 ring-amber-200"
                                : "bg-white border-gray-100 hover:border-amber-100 hover:shadow-lg hover:shadow-amber-100/20"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-lang-bg"
                                className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}

                        <div className="relative flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2.5 rounded-lg transition-colors",
                                    isActive ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-500 group-hover:text-amber-600 group-hover:bg-amber-50"
                                )}>
                                    <Languages className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={cn(
                                        "font-bold text-lg leading-tight",
                                        isActive ? "text-amber-900" : "text-gray-900"
                                    )}>
                                        {lang.nativeName}
                                    </h3>
                                    <p className={cn(
                                        "text-sm font-medium mt-0.5",
                                        isActive ? "text-amber-600/80" : "text-gray-400"
                                    )}>
                                        {lang.name}
                                    </p>
                                </div>
                            </div>

                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-amber-500 rounded-full p-1 shadow-sm"
                                >
                                    <Check className="w-3 h-3 text-white" />
                                </motion.div>
                            )}
                        </div>

                        <div className="relative mt-4 flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md",
                                isActive ? "bg-amber-100/50 text-amber-700" : "bg-gray-50 text-gray-400"
                            )}>
                                {lang.subtext}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
