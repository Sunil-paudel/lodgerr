"use client";

import { useState } from "react";

export default function UploadPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "your_upload_preset"); // from Cloudinary settings

    const res = await fetch("https://api.cloudinary.com/v1_1/dnpcrqcmk/image/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUrl(data.secure_url);
    setUploading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Upload Image to Cloudinary</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {preview && <img src={preview} alt="Preview" className="mt-4 w-64 rounded" />}
      <button
        onClick={handleUpload}
        disabled={!image || uploading}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {url && (
        <div className="mt-4">
          <p>Image uploaded:</p>
          <a href={url} target="_blank" className="text-blue-600 underline">{url}</a>
        </div>
      )}
    </div>
  );
}
