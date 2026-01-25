"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Mic, Image, Video, X, Loader2, Calendar, User, Hammer, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VoiceRecorder from "@/components/dpr/VoiceRecorder";
import { getUserRole } from "@/lib/roleGuard";
import { cn } from "@/lib/utils";

interface DPR {
  id: string;
  date: string;
  work_done: string;
  labor_count: number;
  materials_used?: string | null;
  issues: string | null;
  photos?: string[];
  videos?: string[];
  full_text?: string;
  short_summary?: string;
}

export function EnhancedDPR() {
  const [dprs, setDprs] = useState<DPR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDPR, setSelectedDPR] = useState<DPR | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadedCount, setLoadedCount] = useState(5);
  const [userRole, setUserRole] = useState<string>("worker");

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    work_done: "",
    labor_count: 0,
    materials_used: "",
    issues: "",
    full_text: "",
    short_summary: "",
  });
  const [voiceText, setVoiceText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchDPRs();
    // Get user role to determine if create button should be shown
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = await getUserRole(user.id);
        setUserRole(role);
      }
    }
    getRole();

    // Real-time subscription
    const channel = supabase
      .channel('dpr-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dprs' },
        (payload) => {
          console.log('Real-time DPR update:', payload);
          fetchDPRs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchDPRs() {
    try {
      const response = await fetch("/api/dprs");
      const data = await response.json();
      if (Array.isArray(data)) {
        setDprs(data);
      }
    } catch (error) {
      console.error("Error fetching DPRs:", error);
    } finally {
      setLoading(false);
    }
  }

  // Summarize text (simple client-side summarization)
  function summarizeText(text: string): string {
    if (!text || text.length < 100) return text;

    // Split into sentences and take first 2-3 sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join(". ");
    return summary + (sentences.length > 3 ? "..." : "");
  }

  // Handle voice text
  function handleVoiceText(text: string) {
    setVoiceText(text);
    setForm(prev => ({
      ...prev,
      work_done: text,
      full_text: text,
      short_summary: summarizeText(text),
    }));
  }

  // Handle file selection
  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "video"
  ) {
    const files = Array.from(e.target.files || []);
    const maxSize = 30 * 1024 * 1024; // 30MB

    files.forEach((file) => {
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 30MB.`);
        return;
      }

      if (type === "photo" && file.type.startsWith("image/")) {
        setPhotos((prev) => [...prev, file]);
      } else if (type === "video" && file.type.startsWith("video/")) {
        setVideos((prev) => [...prev, file]);
      } else {
        alert(`${file.name} is not a valid ${type} file.`);
      }
    });
  }

  // Remove file
  function removeFile(index: number, type: "photo" | "video") {
    if (type === "photo") {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setVideos((prev) => prev.filter((_, i) => i !== index));
    }
  }

  // Upload files to Supabase Storage (dpr bucket)
  async function uploadFiles(): Promise<{ photos: string[]; videos: string[] }> {
    const photoUrls: string[] = [];
    const videoUrls: string[] = [];

    try {
      // Upload photos to dpr bucket
      for (const photo of photos) {
        const fileName = `photos/${Date.now()}-${Math.random().toString(36).substring(7)}-${photo.name}`;
        const { data, error } = await supabase.storage
          .from("dpr")
          .upload(fileName, photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error("Error uploading photo:", error);
          if (error.message.includes("Bucket not found")) {
            throw new Error("Storage bucket 'dpr' not found. Please create it in Supabase Dashboard > Storage.");
          }
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("dpr")
          .getPublicUrl(fileName);
        photoUrls.push(urlData.publicUrl);
      }

      // Upload videos to dpr bucket
      for (const video of videos) {
        const fileName = `videos/${Date.now()}-${Math.random().toString(36).substring(7)}-${video.name}`;
        const { data, error } = await supabase.storage
          .from("dpr")
          .upload(fileName, video, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error("Error uploading video:", error);
          if (error.message.includes("Bucket not found")) {
            throw new Error("Storage bucket 'dpr' not found. Please create it in Supabase Dashboard > Storage.");
          }
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("dpr")
          .getPublicUrl(fileName);
        videoUrls.push(urlData.publicUrl);
      }
    } catch (error) {
      throw error; // Re-throw to be caught by handleSubmit
    }

    return { photos: photoUrls, videos: videoUrls };
  }

  // Submit DPR
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload media files
      const { photos: photoUrls, videos: videoUrls } = await uploadFiles();

      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a DPR");
      }

      // Auto-assign project if not provided
      let projectId = null;
      const { data: assignment } = await supabase
        .from("project_assignments")
        .select("project_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (assignment) {
        projectId = assignment.project_id;
      }

      // Create DPR with media URLs
      const dprData = {
        project_id: projectId,
        date: form.date,
        work_done: form.work_done,
        labor_count: form.labor_count || 0,
        materials_used: form.materials_used || null,
        issues: form.issues || null,
        photos: photoUrls,
        videos: videoUrls,
        full_text: form.full_text || form.work_done,
        short_summary: form.short_summary || summarizeText(form.work_done),
        created_by: user.id,
      };

      const response = await fetch("/api/dprs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dprData),
      });

      if (!response.ok) {
        throw new Error("Failed to create DPR");
      }

      // Reset form
      setForm({
        date: new Date().toISOString().split("T")[0],
        work_done: "",
        labor_count: 0,
        materials_used: "",
        issues: "",
        full_text: "",
        short_summary: "",
      });
      setVoiceText("");
      setPhotos([]);
      setVideos([]);
      setIsCreateOpen(false);

      // Refresh DPRs
      await fetchDPRs();
      // No alert, rely on UI update
    } catch (error) {
      console.error("Error creating DPR:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  }

  const displayedDPRs = dprs.slice(0, loadedCount);

  return (
    <>
      <div className="card-premium animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-700" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-500">
              Daily Progress
            </h2>
          </div>
          {/* Only show create button for workers, not managers */}
          {userRole === "worker" && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="btn-premium bg-green-600 hover:bg-green-700 shadow-green-600/20"
              >
                <FileText className="w-4 h-4 mr-2" />
                New DPR
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedDPRs.map((dpr) => (
                <div
                  key={dpr.id}
                  className="glass-hover flex items-start justify-between p-4 rounded-xl border border-transparent transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-border/50 text-xs font-medium text-foreground/70">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(dpr.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>

                      {(dpr.photos?.length || dpr.videos?.length) ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                          {dpr.photos && dpr.photos.length > 0 && (
                            <span className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-blue-700 border border-blue-100">
                              <Image className="w-3 h-3" />
                              {dpr.photos.length}
                            </span>
                          )}
                          {dpr.videos && dpr.videos.length > 0 && (
                            <span className="flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded text-purple-700 border border-purple-100">
                              <Video className="w-3 h-3" />
                              {dpr.videos.length}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <p className="text-sm text-foreground/90 line-clamp-2 font-medium leading-relaxed">
                      {dpr.short_summary || dpr.work_done}
                    </p>

                    {dpr.labor_count > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground font-medium">
                        <User className="w-3.5 h-3.5" />
                        {dpr.labor_count} workers on site
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs bg-white/50 hover:bg-white border-transparent shadow-sm"
                      onClick={() => {
                        setSelectedDPR(dpr);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {loadedCount < dprs.length && (
              <Button
                variant="outline"
                className="w-full mt-6 h-10 border-dashed border-2 hover:border-solid bg-transparent hover:bg-white/50"
                onClick={() => setLoadedCount((prev) => Math.min(prev + 5, dprs.length))}
              >
                Load More ({dprs.length - loadedCount} remaining)
              </Button>
            )}
          </>
        )}
      </div>

      {/* Create DPR Dialog - Only show for workers */}
      {userRole === "worker" && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-500">
                Create Daily Progress Report
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground/80">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border-input rounded-lg px-3 py-2.5 bg-white focus:ring-green-500/20"
                  required
                />
              </div>

              {/* Voice Recording */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground/80 flex items-center justify-between">
                  <span>Voice Update (Hindi)</span>
                  <span className="text-xs font-normal text-muted-foreground bg-white/50 px-2 py-0.5 rounded">AI Powered</span>
                </label>
                <div className="border border-input rounded-xl p-4 bg-muted/30">
                  <VoiceRecorder onText={handleVoiceText} />
                  {voiceText && (
                    <p className="text-sm text-foreground/80 mt-3 p-3 bg-white/50 rounded-lg border border-border/50 italic">
                      "{voiceText}"
                    </p>
                  )}
                </div>
              </div>

              {/* Work Done */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground/80 flex items-center gap-2">
                  <Hammer className="w-4 h-4" />
                  Work Done *
                </label>
                <textarea
                  value={form.work_done}
                  onChange={(e) => {
                    const text = e.target.value;
                    setForm({
                      ...form,
                      work_done: text,
                      full_text: text,
                      short_summary: summarizeText(text),
                    });
                  }}
                  placeholder="Describe the work done today..."
                  className="w-full border-input rounded-lg px-3 py-2.5 h-32 bg-white focus:ring-green-500/20 resize-none"
                  required
                />
              </div>

              {/* Labor Count */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground/80 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Labor Count
                </label>
                <input
                  type="number"
                  value={form.labor_count}
                  onChange={(e) =>
                    setForm({ ...form, labor_count: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border-input rounded-lg px-3 py-2.5 bg-white focus:ring-green-500/20"
                  min="0"
                />
              </div>

              {/* Materials Used */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground/80">
                  Materials Used
                </label>
                <textarea
                  value={form.materials_used}
                  onChange={(e) =>
                    setForm({ ...form, materials_used: e.target.value })
                  }
                  placeholder="List materials used..."
                  className="w-full border-input rounded-lg px-3 py-2.5 h-20 bg-white focus:ring-green-500/20 resize-none"
                />
              </div>

              {/* Issues */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground/80 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Issues
                </label>
                <textarea
                  value={form.issues}
                  onChange={(e) => setForm({ ...form, issues: e.target.value })}
                  placeholder="Any issues or concerns..."
                  className="w-full border-red-200/50 rounded-lg px-3 py-2.5 h-20 bg-red-50/20 backdrop-blur-sm focus:ring-red-500/20 resize-none"
                />
              </div>

              {/* Media Uploads Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">Photos</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e, "photo")}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12 border-dashed border-2 hover:border-solid hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                  >
                    <Image className="w-5 h-5 mr-2" />
                    Add Photos
                  </Button>
                  {photos.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground font-medium">
                      {photos.length} photos selected
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground/80">Videos</label>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleFileSelect(e, "video")}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full h-12 border-dashed border-2 hover:border-solid hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Add Videos
                  </Button>
                  {videos.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground font-medium">
                      {videos.length} videos selected
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 h-11 border-input bg-white hover:bg-accent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 h-11 btn-premium bg-green-600 hover:bg-green-700 shadow-green-600/20"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Create DPR"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View DPR Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card border-0 shadow-2xl p-0">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Site Report <span className="text-muted-foreground font-normal text-lg ml-2">{selectedDPR && new Date(selectedDPR.date).toLocaleDateString()}</span>
              </DialogTitle>
            </DialogHeader>
          </div>

          {selectedDPR && (
            <div className="p-6 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white/60 p-4 rounded-xl border border-white/20 shadow-sm">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Work Done
                    </h3>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {selectedDPR.work_done}
                    </p>
                  </div>

                  {selectedDPR.materials_used && (
                    <div className="bg-white/60 p-4 rounded-xl border border-white/20 shadow-sm">
                      <h3 className="font-semibold mb-2">Materials Used</h3>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {selectedDPR.materials_used}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sidebar Details */}
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-1 text-sm">Labor Force</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-700">{selectedDPR.labor_count}</span>
                      <span className="text-xs text-blue-600 font-medium">Workers</span>
                    </div>
                  </div>

                  {selectedDPR.issues && (
                    <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                      <h3 className="font-semibold text-red-800 mb-1 flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Issues Reported
                      </h3>
                      <p className="text-xs text-red-700 mt-1">{selectedDPR.issues}</p>
                    </div>
                  )}
                </div>
              </div>


              {/* Media Section */}
              {(selectedDPR.photos?.length > 0 || selectedDPR.videos?.length > 0) && (
                <div className="border-t border-border/40 pt-6">
                  <h3 className="font-semibold mb-4 text-lg">Site Media</h3>

                  {selectedDPR.photos && selectedDPR.photos.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Image className="w-4 h-4" /> Photos
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedDPR.photos.map((url, index) => (
                          <div key={index} className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => window.open(url, "_blank")}>
                            <img
                              src={url}
                              alt={`DPR photo ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDPR.videos && selectedDPR.videos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Video className="w-4 h-4" /> Videos
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedDPR.videos.map((url, index) => (
                          <div key={index} className="rounded-xl overflow-hidden border border-border/50 bg-black/5">
                            <video
                              src={url}
                              controls
                              className="w-full max-h-64"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function formatErrorForUser(error: any) {
  throw new Error("Function not implemented.");
}

