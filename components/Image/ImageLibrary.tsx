
"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  X,
  Upload,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface ImageItem {
  url: string;
  name: string;
  size: string;
  modified: string;
}

interface ImageLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt: string) => void;
  postSlug?: string;
  postTitle?: string;
}

interface ImagesApiResponse {
  images: ImageItem[];
}

interface UploadApiResponse {
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

function parseImagesResponse(value: unknown): ImagesApiResponse {
  if (!isRecord(value) || !Array.isArray(value.images)) {
    throw new Error("Invalid image library response.");
  }

  const images = value.images.filter(
    (item): item is Record<string, unknown> =>
      isRecord(item) &&
      typeof item.url === "string" &&
      typeof item.name === "string"
  ).map((item) => ({
    url: item.url as string,
    name: item.name as string,
    size: typeof item.size === "string" ? item.size : "",
    modified: typeof item.modified === "string" ? item.modified : "",
  }));

  return { images };
}

function parseUploadResponse(value: unknown): UploadApiResponse {
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

export default function ImageLibrary({
  isOpen,
  onClose,
  onSelect,
  postSlug,
  postTitle,
}: ImageLibraryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const uploadInProgressRef = useRef(false);

  // ==================== FETCH IMAGES ====================

  const fetchImages = useCallback(async () => {
    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/images", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? "You are not authorized to access the image library."
            : "Failed to fetch images."
        );
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("Invalid response from image library.");
      }

      const rawData: unknown = await response.json();
      const data = parseImagesResponse(rawData);

      setImages(data.images);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Failed to fetch images:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load images."
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // ==================== MODAL LIFECYCLE ====================

  useEffect(() => {
    if (!isOpen) {
      requestControllerRef.current?.abort();
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchImages();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      requestControllerRef.current?.abort();
    };
  }, [isOpen, fetchImages]);

  // ==================== UPLOAD IMAGE ====================

  const uploadImage = useCallback(
    async (file: File) => {
      if (uploadInProgressRef.current) {
        return;
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("Please select a supported image: JPG, PNG, WebP, GIF or AVIF.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("Image size must not exceed 10 MB.");
        return;
      }

      uploadInProgressRef.current = true;
      setUploading(true);
      setError("");

      const formData = new FormData();

      formData.append("file", file);

      if (postSlug) {
        formData.append("slug", postSlug);
      }

      if (postTitle) {
        formData.append("title", postTitle);
      }

      try {
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.toLowerCase().includes("application/json")) {
          throw new Error("Invalid response received during upload.");
        }

        const rawData: unknown = await response.json();
        const data = parseUploadResponse(rawData);

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Image upload failed.");
        }

        if (!data.url) {
          throw new Error("Upload succeeded but image URL was not returned.");
        }

        await fetchImages();

        onSelect(
          data.url,
          data.alt || postTitle || file.name
        );

        onClose();
      } catch (err: unknown) {
        console.error("Image upload error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Image upload failed."
        );
      } finally {
        uploadInProgressRef.current = false;
        setUploading(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [postSlug, postTitle, fetchImages, onSelect, onClose]
  );

  // ==================== FILE SELECT ====================

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void uploadImage(file);
    }
  };

  // ==================== DRAG AND DROP ====================

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (uploading) return;

    if (
      event.type === "dragenter" ||
      event.type === "dragover"
    ) {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    if (uploading) return;

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void uploadImage(file);
    }
  };

  // ==================== SELECT IMAGE ====================

  const handleSelectImage = (image: ImageItem) => {
    onSelect(image.url, image.name);
    onClose();
  };

  if (!isOpen) return null;

  // ==================== MAIN UI ====================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-library-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2
              id="image-library-title"
              className="text-lg font-semibold"
            >
              Image Library
            </h2>

            <p className="text-xs text-gray-400">
              {images.length} images available
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchImages()}
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Refresh"
              aria-label="Refresh image library"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-500 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
              aria-label="Close image library"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* UPLOAD AREA */}
        <div
          className={`m-4 border-2 border-dashed rounded-lg transition ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          } ${uploading ? "opacity-70" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="p-6 text-center">
            {uploading ? (
              <div>
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-500" />

                <p className="text-sm text-gray-500 mt-2">
                  Uploading & compressing...
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-gray-400" />

                <p className="text-sm text-gray-500 mt-2">
                  Drag & drop image here or
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Files
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <p className="text-xs text-gray-400 mt-3">
                  Maximum file size: 10 MB
                </p>

                {postSlug && (
                  <p className="text-xs text-blue-500 mt-1">
                    Will be saved as: {postSlug}.webp
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mx-4 mb-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />

            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* IMAGE GRID */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 border-t">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🖼️</div>

              <p className="text-gray-500">
                No images in library
              </p>

              <p className="text-sm text-gray-400">
                Upload your first image above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => handleSelectImage(image)}
                  disabled={uploading}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition bg-gray-100 disabled:opacity-50"
                  title={`Select ${image.name}`}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      Select
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                    {image.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t text-xs text-gray-400 text-center flex justify-between items-center">
          <span>{images.length} images in library</span>

          <span className="text-gray-400">
            Click image to select
          </span>
        </div>
      </div>
    </div>
  );
}
