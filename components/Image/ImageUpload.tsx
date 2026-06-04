// /components/Image/ImageUpload.tsx

'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (url: string, alt: string) => void;
  currentImage?: string;
  currentAlt?: string;
  postSlug?: string;
  postTitle?: string;
  postType?: string;
}

export default function ImageUpload({ 
  onImageSelect, 
  currentImage, 
  currentAlt,
  postSlug,
  postTitle,
  postType = 'news'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    if (postSlug) formData.append('slug', postSlug);
    if (postTitle) formData.append('title', postTitle);
    formData.append('type', postType);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setPreview(data.url);
        onImageSelect(data.url, data.alt);
        console.log('✅ Image uploaded:', data.url);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview('');
    onImageSelect('', '');
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
      {preview ? (
        <div className="relative">
          <div className="relative h-48 mx-auto overflow-hidden rounded-lg bg-gray-100">
            <img
              src={preview}
              alt={currentAlt || 'Preview'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2 justify-center mt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer py-8"
        >
          {uploading ? (
            <div>
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-500" />
              <p className="text-sm text-gray-500 mt-2">Uploading & compressing...</p>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Click to upload image</p>
              <p className="text-xs text-gray-400 mt-2">Auto-compressed to WebP (70% quality)</p>
              {postSlug && (
                <p className="text-xs text-blue-500 mt-1">Will be saved as: {postSlug}.webp</p>
              )}
            </div>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}