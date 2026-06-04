// app/admin/components/ImageLibrary.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, RefreshCw } from 'lucide-react';

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

export default function ImageLibrary({ 
  isOpen, 
  onClose, 
  onSelect, 
  postSlug,
  postTitle 
}: ImageLibraryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/images');
      const data = await res.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch images from server when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const timeout = setTimeout(fetchImages, 0);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (postSlug) formData.append('slug', postSlug);
    if (postTitle) formData.append('title', postTitle);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        await fetchImages(); // Refresh library with new image
        onSelect(data.url, data.alt);
        onClose();
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Image Library</h2>
            <p className="text-xs text-gray-400">{images.length} images available</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchImages}
              className="p-1 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upload Area - Drag & Drop */}
        <div 
          className={`m-4 border-2 border-dashed rounded-lg transition ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="p-6 text-center">
            {uploading ? (
              <div>
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-500" />
                <p className="text-sm text-gray-500 mt-2">Uploading & compressing...</p>
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
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-3">
                  Auto-compressed to WebP • Saved to server
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

        {/* Image Grid - Shows images from server */}
        <div className="flex-1 overflow-y-auto p-4 border-t">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🖼️</div>
              <p className="text-gray-500">No images in library</p>
              <p className="text-sm text-gray-400">Upload your first image above</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(image.url, image.name);
                    onClose();
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition bg-gray-100"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Select</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                    {image.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-xs text-gray-400 text-center flex justify-between items-center">
          <span>{images.length} images in library</span>
          <span className="text-gray-400">Click image to select</span>
        </div>
      </div>
    </div>
  );
}