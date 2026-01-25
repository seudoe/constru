"use client";
import { useState } from "react";

export default function VoiceRecorder({ onText }: { onText: (t: string) => void }) {
  const [listening, setListening] = useState(false);

  const startRecording = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onText(transcript);
    };

    recognition.start();
  };

  return (
    <button
      onClick={startRecording}
      className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg"
    >
      {listening ? "Sun raha hoon..." : "🎙 Bolo Update"}
    </button>
  );
}
