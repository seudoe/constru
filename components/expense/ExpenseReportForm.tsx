"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, Camera, Upload, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ExpenseReportForm() {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [geoData, setGeoData] = useState<{ lat: number; lng: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ---------------- FILE UPLOAD ----------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setGeoData(null);
    setAddress(null);
    setShowCamera(false);
  };

  // ---------------- CAMERA ----------------
  const startCamera = async () => {
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Camera permission denied");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;

    const stream = video.srcObject as MediaStream;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data?.display_name) setAddress(data.display_name);
        } catch {}

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;

          setImageFile(new File([blob], "geo-capture.jpg", { type: "image/jpeg" }));
          setPreviewUrl(URL.createObjectURL(blob));
          setGeoData({ lat, lng });
          setShowCamera(false);

          stream.getTracks().forEach((t) => t.stop());
        }, "image/jpeg");
      },
      () => toast.error("Location permission denied")
    );
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!imageFile) {
      toast.error("Please upload or capture an image");
      return;
    }

    setUploading(true);
    const supabase = createClient();

    try {
      const fileName = `${Date.now()}-${crypto.randomUUID()}.jpg`;

      // Upload
      const upload = await supabase.storage
        .from("expense-photos")
        .upload(fileName, imageFile);

      if (upload.error) {
        throw new Error(`Upload failed: ${upload.error.message}`);
      }

      const publicUrl = supabase.storage
        .from("expense-photos")
        .getPublicUrl(fileName).data.publicUrl;

      const { data: auth } = await supabase.auth.getUser();

      // Insert DB
      const insert = await supabase.from("expense_reports").insert({
        worker_id: auth?.user?.id ?? null,
        image_url: publicUrl,
        description,
        latitude: geoData?.lat ?? null,
        longitude: geoData?.lng ?? null,
        address: address ?? null,
      });

      if (insert.error) {
        throw new Error(`DB insert failed: ${insert.error.message}`);
      }

      toast.success("Expense report submitted successfully");

      setDescription("");  
      setImageFile(null);
      setPreviewUrl(null);   
      setGeoData(null);
      setAddress(null);
    } catch (err: any) {
      console.error("FINAL ERROR:", err.message);
      toast.error(err.message || "Submission failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="p-6 border rounded-xl max-w-md mx-auto space-y-4">
      <h3 className="text-xl font-bold flex gap-2">
        <Upload className="w-5 h-5" /> Expense Report
      </h3>

      <Label>Description</Label>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          <Button variant="outline" className="w-full">
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
        </div>

        <Button onClick={startCamera} variant="secondary">
          <Camera className="w-4 h-4 mr-2" /> Geo-Capture
        </Button>
      </div>

      {showCamera && (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <Button
            size="sm"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black"
            onClick={capturePhoto}
          >
            Capture
          </Button>
          <button
            onClick={() => setShowCamera(false)}
            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {previewUrl && !showCamera && (
        <div className="relative border rounded-lg overflow-hidden">
          <img src={previewUrl} className="w-full h-48 object-cover" />
          {geoData && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex gap-1">
              <MapPin className="w-3 h-3" />
              {address || `${geoData.lat.toFixed(4)}, ${geoData.lng.toFixed(4)}`}
            </div>
          )}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={uploading || !imageFile} className="w-full">
        {uploading ? <Loader2 className="animate-spin" /> : "Submit Report"}
      </Button>
    </div>
  );
}
// tempchanges