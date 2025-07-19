import React, { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { supabase } from "../supabaseClient";
import { FaCamera, FaTrash } from "react-icons/fa";

export default function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Get today's date as YYYY-MM-DD
  const todayFolder = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetchGallery();
    // eslint-disable-next-line
  }, []);

  async function fetchGallery() {
    // Fetch only today's uploads (last 24 hours)
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });
    if (!error) setGallery(data || []);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded = [];
    for (const file of files) {
      const filePath = `${todayFolder}/${Date.now()}_${file.name}`;
      let uploadRes = await supabase.storage.from("gallery-images").upload(filePath, file);

      if (uploadRes.error) {
        console.error("Upload failed!", uploadRes.error.message);
        alert(`Upload failed for ${file.name}!`);
        continue;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("gallery-images").getPublicUrl(filePath);
      const url = publicUrlData?.publicUrl;
      if (!url) {
        alert(`Could not get public URL for ${file.name}.`);
        continue;
      }

      // Save to gallery table
      const { error } = await supabase.from("gallery").insert([{ url }]);
      if (error) {
        console.error("Failed to save to gallery table:", error.message);
        alert(`Failed to save ${file.name} to gallery table!`);
        continue;
      }
      uploaded.push(file.name);
    }
    setUploading(false);
    setFiles([]);
    fetchGallery();
    if (uploaded.length > 0) {
      alert(`Uploaded: ${uploaded.join(", ")}`);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm("Delete this media?")) return;
    // Remove from storage
    const urlParts = item.url.split("/gallery-images/");
    if (urlParts.length === 2) {
      const storagePath = urlParts[1];
      await supabase.storage.from("gallery-images").remove([storagePath]);
    }
    // Remove from table
    const { error } = await supabase.from("gallery").delete().eq("id", item.id);
    if (!error) fetchGallery();
  }

  return (
    <BackgroundWrapper>
      <PageContainer title="GALLERY">
        <div className="grid grid-cols-4 gap-3 px-3 pb-8 mt-4">
          {/* Upload Icon */}
          <div className="flex flex-col items-center justify-center">
            <form onSubmit={handleUpload} className="flex flex-col items-center gap-1">
              <label
                htmlFor="gallery-upload"
                className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-yellow-100 border-2 border-yellow-400 cursor-pointer hover:bg-yellow-200 transition"
                style={{ fontSize: 32 }}
                title="Upload Photo/Video"
              >
                <FaCamera />
                <input
                  id="gallery-upload"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  multiple
                  onChange={e => setFiles(Array.from(e.target.files))}
                  disabled={uploading}
                />
              </label>
              {files && files.length > 0 && (
                <div className="text-xs text-gray-700 mt-1 max-w-[80px] break-words">
                  {files.map(f => f.name).join(", ")}
                </div>
              )}
              <button
                type="submit"
                disabled={uploading || !files || files.length === 0}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded px-2 py-0.5 text-xs mt-1 transition"
                style={{ width: "56px" }}
              >
                {uploading ? "..." : "Upload"}
              </button>
            </form>
          </div>
          {/* Gallery Items */}
          {gallery.length === 0 && (
            <div className="col-span-3 flex items-center justify-center text-yellow-900 font-semibold">
              No media found for today.
            </div>
          )}
          {gallery.map((item) => (
            <div
              key={item.id}
              className="relative rounded-xl shadow p-1 flex flex-col items-center justify-center gap-1 transition bg-white/60"
              style={{
                minHeight: "70px",
                fontSize: "0.85rem",
                backdropFilter: "blur(2px)",
                color: "#1e293b",
              }}
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(item)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs shadow transition"
                title="Delete"
                style={{ zIndex: 10 }}
              >
                <FaTrash size={12} />
              </button>
              {item.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <>
                  <img
                    src={item.url}
                    alt="Gallery"
                    className="w-14 h-14 rounded object-cover"
                    style={{ maxHeight: 56, maxWidth: 56 }}
                  />
                  <a
                    href={item.url}
                    download
                    className="text-xs text-blue-700 underline mt-1 hover:text-blue-900"
                    style={{ wordBreak: 'break-all' }}
                  >
                    Download
                  </a>
                </>
              ) : (
                <>
                  <video
                    src={item.url}
                    controls
                    className="w-14 h-14 rounded"
                    style={{ maxHeight: 56, maxWidth: 56 }}
                  />
                  <a
                    href={item.url}
                    download
                    className="text-xs text-blue-700 underline mt-1 hover:text-blue-900"
                    style={{ wordBreak: 'break-all' }}
                  >
                    Download
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}
