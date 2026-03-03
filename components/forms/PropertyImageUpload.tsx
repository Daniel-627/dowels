"use client";

import { useState } from "react";
import Image from "next/image";

interface UploadedImage {
  url: string;
  assetId: string;
}

interface Props {
  propertyId: string;
  onUploadComplete?: (images: UploadedImage[]) => void;
}

export default function PropertyImageUpload({ propertyId, onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList) {
    setError("");
    setUploading(true);

    const uploaded: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        continue;
      }

      const saveRes = await fetch("/api/properties/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          url: data.url,
          caption: file.name,
        }),
      });

      if (saveRes.ok) {
        uploaded.push({ url: data.url, assetId: data.assetId });
      }
    }

    const allImages = [...images, ...uploaded];
    setImages(allImages);
    onUploadComplete?.(allImages);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-4">

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition ${
          dragOver
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="text-sm font-medium text-gray-700">
            {uploading ? "Uploading..." : "Drop images here or click to upload"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WebP — max 5MB each
          </p>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={img.url}
                alt={`Property image ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}