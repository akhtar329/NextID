
"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Upload, Loader2, Link2, Globe, AlertCircle } from "lucide-react";

interface ImageUploadProps {
  onImageSelect: (url: string, alt: string) => void;
  currentImage?: string;
  currentAlt?: string;
  postSlug?: string;
  postTitle?: string;
  postType?: string;
}

interface UploadResponse {
  success: boolean;
  url?: string;
  alt?: string;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseUploadResponse(value: unknown): UploadResponse {
  if (!isRecord(value) || typeof value.success !== "boolean") {
    throw new Error("Invalid upload response from server.");
  }

  return {
    success: value.success,
    url: typeof value.url === "string" ? value.url : undefined,
    alt: typeof value.alt === "string" ? value.alt : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
  };
}

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());

    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

export default function ImageUpload({
  onImageSelect,
  currentImage,
  currentAlt,
  postSlug,
  postTitle,
  postType = "news",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState(currentImage || "");
  const [altText, setAltText] = useState(currentAlt || "");
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInProgressRef = useRef(false);

  // ==================== SYNC PROPS ====================

  useEffect(() => {
    setPreview(currentImage || "");
    setImageUrl(currentImage || "");
    setAltText(currentAlt || "");
  }, [currentImage, currentAlt]);

  // ==================== FILE UPLOAD ====================

  const handleFileSelect = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (uploadInProgressRef.current) return;

    setError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a supported image: JPG, PNG, WebP, GIF or AVIF.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must not exceed 10 MB.");
      event.target.value = "";
      return;
    }

    uploadInProgressRef.current = true;
    setUploading(true);

    const formData = new FormData();

    formData.append("file", file);

    if (postSlug) {
      formData.append("slug", postSlug);
    }

    if (postTitle) {
      formData.append("title", postTitle);
    }

    formData.append("type", postType);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("Invalid response received during image upload.");
      }

      const rawData: unknown = await response.json();
      const data = parseUploadResponse(rawData);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Image upload failed.");
      }

      if (!data.url || !isValidImageUrl(data.url)) {
        throw new Error("Server did not return a valid image URL.");
      }

      const newAlt = data.alt || postTitle || file.name;

      setPreview(data.url);
      setImageUrl(data.url);
      setAltText(newAlt);
      setActiveTab("upload");

      onImageSelect(data.url, newAlt);
    } catch (err: unknown) {
      console.error("Image upload error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Image upload failed. Please try again."
      );
    } finally {
      uploadInProgressRef.current = false;
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ==================== EXTERNAL URL ====================

  const handleUrlSubmit = () => {
    setError("");

    const normalizedUrl = imageUrl.trim();

    if (!normalizedUrl) {
      setError("Please enter an image URL.");
      return;
    }

    if (!isValidImageUrl(normalizedUrl)) {
      setError("Please enter a valid HTTP or HTTPS image URL.");
      return;
    }

    setPreview(normalizedUrl);
    setImageUrl(normalizedUrl);

    onImageSelect(normalizedUrl, altText.trim());
  };

  // ==================== ALT TEXT ====================

  const handleAltChange = (value: string) => {
    setAltText(value);

    if (preview) {
      onImageSelect(preview, value);
    }
  };

  // ==================== REMOVE IMAGE ====================

  const handleRemove = () => {
    setPreview("");
    setImageUrl("");
    setAltText("");
    setError("");

    onImageSelect("", "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==================== IMAGE LOAD ERROR ====================

  const handleImageError = () => {
    setPreview("");
    setError("Image failed to load. Check the image URL and try again.");
  };

  // ==================== MAIN UI ====================

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">

      {/* TABS */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          type="button"
          onClick={() => {
            setActiveTab("upload");
            setError("");
          }}
          disabled={uploading}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "upload"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Upload className="inline w-4 h-4 mr-2" />
          Upload File
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("url");
            setError("");
          }}
          disabled={uploading}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "url"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Globe className="inline w-4 h-4 mr-2" />
          External URL
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />

          <p className="text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* PREVIEW AREA */}
      {preview ? (
        <div className="relative">
          <div className="relative h-48 mx-auto overflow-hidden rounded-lg bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={altText || "Image preview"}
              className="w-full h-full object-contain"
              onError={handleImageError}
            />
          </div>

          {/* ALT TEXT */}
          <input
            type="text"
            value={altText}
            onChange={(event) => handleAltChange(event.target.value)}
            placeholder="Image alt text (for SEO)"
            maxLength={250}
            className="w-full mt-2 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* ACTION BUTTONS */}
          <div className="flex gap-2 justify-center mt-3">
            {activeTab === "upload" ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Change File
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("url");
                  setPreview("");
                }}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Change URL
              </button>
            )}

            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* UPLOAD TAB */}
          {activeTab === "upload" && (
            <div
              onClick={() => {
                if (!uploading) {
                  fileInputRef.current?.click();
                }
              }}
              className={`py-8 text-center ${
                uploading
                  ? "cursor-not-allowed"
                  : "cursor-pointer hover:bg-gray-50"
              } rounded-lg transition`}
            >
              {uploading ? (
                <div>
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-500" />

                  <p className="text-sm text-gray-500 mt-2">
                    Uploading & compressing...
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 mx-auto text-gray-400" />

                  <p className="text-sm text-gray-500 mt-2">
                    Click to upload image
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    Auto-compressed to WebP (75% quality)
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Maximum file size: 10 MB
                  </p>

                  {postSlug && (
                    <p className="text-xs text-blue-500 mt-1">
                      Will be saved as: {postSlug}.webp
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* URL TAB */}
          {activeTab === "url" && (
            <div className="py-6">
              <Link2 className="w-10 h-10 mx-auto text-gray-400" />

              <p className="text-sm text-gray-500 mt-2 text-center">
                Enter image URL from any website
              </p>

              <p className="text-xs text-gray-400 text-center mt-1">
                Supports Blogger, Unsplash, Imgur, Flickr, or direct image links
              </p>

              <div className="mt-4 space-y-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="text"
                  value={altText}
                  onChange={(event) => setAltText(event.target.value)}
                  placeholder="Image description (alt text)"
                  maxLength={250}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!imageUrl.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  Add Image from URL
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
