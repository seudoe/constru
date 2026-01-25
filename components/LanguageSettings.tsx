'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function LanguageSettings() {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);

    const changeLanguage = (lng: string) => {
        console.log("Changing language to:", lng);
        i18n.changeLanguage(lng);
        setOpen(false);
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ta', name: 'தமிழ் (Tamil)' },
        { code: 'hi', name: 'हिंदी (Hindi)' },
        { code: 'mr', name: 'मराठी (Marathi)' },
    ];

    // Get current language code (handle 'en-US' etc)
    const currentLang = i18n.language?.split('-')[0] || 'en';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-stone-600 hover:text-stone-900">
                    <Settings className="w-5 h-5" />
                    <span className="sr-only">{t('settings')}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('select_language')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <RadioGroup value={currentLang} onValueChange={changeLanguage} className="grid grid-cols-1 gap-2">
                        {languages.map((lang) => (
                            <div key={lang.code} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 cursor-pointer">
                                <RadioGroupItem value={lang.code} id={lang.code} />
                                <Label htmlFor={lang.code} className="flex-1 cursor-pointer font-medium">
                                    {lang.name}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </DialogContent>
        </Dialog>
    );
}
