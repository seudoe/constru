export interface DPRData {
  date: string;
  work_done: string;
  labor_count: number;
  materials_used: string | null;
  issues: string | null;
  photos?: string[];
  videos?: string[];
  project_name?: string | null;
  created_by_name?: string | null;
}

export function generateDPRHTML(data: DPRData) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const photosHTML = data.photos && Array.isArray(data.photos) && data.photos.length > 0
    ? `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Photos (${data.photos.length}):</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${data.photos.map((photo, idx) => `
            <div style="border: 1px solid #ddd; padding: 5px; text-align: center;">
              <p style="font-size: 10px; margin: 5px 0;">Photo ${idx + 1}</p>
              <p style="font-size: 9px; color: #666; word-break: break-all;">${photo.substring(0, 60)}...</p>
            </div>
          `).join("")}
        </div>
      </div>
    `
    : "";

  const videosHTML = data.videos && Array.isArray(data.videos) && data.videos.length > 0
    ? `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Videos (${data.videos.length}):</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${data.videos.map((video, idx) => `
            <div style="border: 1px solid #ddd; padding: 5px; text-align: center;">
              <p style="font-size: 10px; margin: 5px 0;">Video ${idx + 1}</p>
              <p style="font-size: 9px; color: #666; word-break: break-all;">${video.substring(0, 60)}...</p>
            </div>
          `).join("")}
        </div>
      </div>
    `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { 
    font-family: Arial, sans-serif; 
    padding: 40px; 
    margin: 0;
    background: white;
  }
  h1 { 
    text-align: center; 
    color: #2563eb;
    margin-bottom: 10px;
    font-size: 28px;
  }
  .subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 30px;
    font-size: 14px;
  }
  .header { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #2563eb;
  }
  .header > div {
    flex: 1;
  }
  .header > div:last-child {
    text-align: right;
  }
  .section { 
    margin: 25px 0;
    padding: 15px;
    background-color: #f9fafb;
    border-left: 4px solid #2563eb;
  }
  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #2563eb;
    margin-bottom: 10px;
  }
  .section-content {
    font-size: 13px;
    line-height: 1.6;
    color: #333;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .info-label {
    font-weight: bold;
    color: #666;
    font-size: 12px;
  }
  .info-value {
    color: #333;
    font-size: 13px;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 11px;
    color: #666;
  }
</style>
</head>
<body>

<h1>Daily Progress Report</h1>
<p class="subtitle">Construction Management System</p>

<div class="header">
  <div>
    <div style="font-size: 16px; font-weight: bold; color: #333;">Date: ${formatDate(data.date)}</div>
    ${data.project_name ? `<div style="font-size: 14px; color: #666; margin-top: 5px;">Project: ${data.project_name}</div>` : ""}
  </div>
  <div style="font-size: 12px; color: #666;">
    ${data.created_by_name ? `<div>Reported by: ${data.created_by_name}</div>` : ""}
    <div style="margin-top: 5px;">Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Work Done</div>
  <div class="section-content">${data.work_done.replace(/\n/g, "<br>")}</div>
</div>

<div class="info-row">
  <span class="info-label">Labor Count:</span>
  <span class="info-value">${data.labor_count} ${data.labor_count === 1 ? "worker" : "workers"}</span>
</div>

${data.materials_used ? `
<div class="section">
  <div class="section-title">Materials Used</div>
  <div class="section-content">${data.materials_used.replace(/\n/g, "<br>")}</div>
</div>
` : ""}

${data.issues ? `
<div class="section" style="border-left-color: #dc2626; background-color: #fef2f2;">
  <div class="section-title" style="color: #dc2626;">Issues & Concerns</div>
  <div class="section-content">${data.issues.replace(/\n/g, "<br>")}</div>
</div>
` : ""}

${photosHTML}

${videosHTML}

<div class="footer">
  <p>This report was generated automatically by the Construction Management System.</p>
  <p style="margin-top: 5px;">For any queries, please contact the project manager.</p>
</div>

</body>
</html>
`;
}
