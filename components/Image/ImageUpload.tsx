// /components/Image/ImageUpload.tsx

'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, Link2, Globe } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState(currentImage || '');
  const [altText, setAltText] = useState(currentAlt || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local file upload handler
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
        setImageUrl(data.url);
        onImageSelect(data.url, data.alt);
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

  // External URL handler (Blogger, Unsplash, Imgur, etc.)
  const handleUrlSubmit = () => {
    if (!imageUrl) {
      alert('Please enter an image URL');
      return;
    }

    // Validate URL
    try {
      new URL(imageUrl);
    } catch {
      alert('Please enter a valid URL (e.g., https://...)');
      return;
    }

    setPreview(imageUrl);
    onImageSelect(imageUrl, altText);
  };

  const handleRemove = () => {
    setPreview('');
    setImageUrl('');
    setAltText('');
    onImageSelect('', '');
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload className="inline w-4 h-4 mr-2" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="inline w-4 h-4 mr-2" />
          External URL
        </button>
      </div>

      {/* Preview Area */}
      {preview ? (
        <div className="relative">
          <div className="relative h-48 mx-auto overflow-hidden rounded-lg bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={altText || 'Preview'}
              className="w-full h-full object-cover"
              onError={() => {
                alert('Image failed to load. Check the URL and try again.');
                setPreview('');
              }}
            />
          </div>
          
          {/* Alt Text Input */}
          <input
            type="text"
            value={altText}
            onChange={(e) => {
              setAltText(e.target.value);
              onImageSelect(preview, e.target.value);
            }}
            placeholder="Image alt text (for SEO)"
            className="w-full mt-2 px-3 py-1 text-sm border rounded-lg"
          />
          
          <div className="flex gap-2 justify-center mt-3">
            {activeTab === 'upload' ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Change File
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('url');
                  setPreview('');
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Change URL
              </button>
            )}
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
        <>
          {/* Upload Tab Content */}
          {activeTab === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer py-8 text-center"
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
                  <p className="text-xs text-gray-400 mt-2">Auto-compressed to WebP (75% quality)</p>
                  {postSlug && (
                    <p className="text-xs text-blue-500 mt-1">Will be saved as: {postSlug}.webp</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* URL Tab Content */}
          {activeTab === 'url' && (
            <div className="py-6">
              <Link2 className="w-10 h-10 mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2 text-center">
                Enter image URL from any website
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Supports: Blogger, Unsplash, Imgur, Flickr, or any direct image link
              </p>
              
              <div className="mt-4 space-y-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://blogger.googleusercontent.com/img/b/..."
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Image description (alt text)"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!imageUrl}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  Add Image from URL
                </button>
              </div>
            </div>
          )}
        </>
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