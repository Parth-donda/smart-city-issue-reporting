import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Camera,
  Film,
  Trash2,
  FileImage,
  AlertCircle,
  Tag
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface UploadedMediaItem {
  id: string;
  file: File;
  type: 'image' | 'video';
  previewUrl: string;
  captureSource: string;
  caption?: string;
}

export interface MediaUploadProps {
  items: UploadedMediaItem[];
  onChange: (items: UploadedMediaItem[]) => void;
  maxImages?: number;
  maxVideos?: number;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  items,
  onChange,
  maxImages = 3,
  maxVideos = 1,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);

  const imageCount = items.filter((i) => i.type === 'image').length;
  const videoCount = items.filter((i) => i.type === 'video').length;

  const handleFiles = (files: FileList | null, source: 'CAMERA' | 'GALLERY') => {
    if (!files || files.length === 0) return;
    setError(null);

    const newItems: UploadedMediaItem[] = [...items];

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setError('Unsupported file type. Please upload JPEG, PNG, WEBP images or MP4 videos.');
        return;
      }

      if (isImage) {
        const currentImgs = newItems.filter((i) => i.type === 'image').length;
        if (currentImgs >= maxImages) {
          setError(`Maximum ${maxImages} photo${maxImages > 1 ? 's' : ''} allowed.`);
          return;
        }
        if (file.size > 15 * 1024 * 1024) {
          setError('Image size exceeds 15MB limit.');
          return;
        }
      }

      if (isVideo) {
        const currentVids = newItems.filter((i) => i.type === 'video').length;
        if (currentVids >= maxVideos) {
          setError(`Maximum ${maxVideos} video${maxVideos > 1 ? 's' : ''} allowed.`);
          return;
        }
        if (file.size > 50 * 1024 * 1024) {
          setError('Video size exceeds 50MB limit.');
          return;
        }
      }

      const item: UploadedMediaItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        type: isImage ? 'image' : 'video',
        previewUrl: URL.createObjectURL(file),
        captureSource: source,
        caption: '',
      };

      newItems.push(item);
    });

    onChange(newItems);
  };

  const handleRemove = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(items.filter((i) => i.id !== id));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onChange(
      items.map((i) => (i.id === id ? { ...i, caption } : i))
    );
  };

  const canAddMoreImages = imageCount < maxImages;
  const canAddMoreVideos = videoCount < maxVideos;

  return (
    <div className="space-y-4">
      {/* Upload action area */}
      <div className="border-2 border-dashed border-line hover:border-primary-600/60 rounded-card p-6 bg-surface/50 text-center transition-colors">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-950">
              Upload Photos or Short Video Evidence
            </p>
            <p className="text-xs text-ink-500 mt-1">
              Provide clear visual evidence to expedite municipal verification and dispatch.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<FileImage className="w-4 h-4 text-primary-600" />}
              disabled={!canAddMoreImages && !canAddMoreVideos}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Camera className="w-4 h-4 text-ink-700" />}
              disabled={!canAddMoreImages}
              onClick={() => cameraInputRef.current?.click()}
            >
              Take Photo
            </Button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files, 'GALLERY');
              e.target.value = '';
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files, 'CAMERA');
              e.target.value = '';
            }}
          />

          <div className="flex items-center justify-center gap-4 text-[11px] text-ink-500 pt-1">
            <span>Photos: {imageCount}/{maxImages} (min 1 required)</span>
            <span>•</span>
            <span>Videos: {videoCount}/{maxVideos}</span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-input flex items-start gap-2.5 text-xs text-status-rejected">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded media previews list */}
      {items.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-ink-700">
            Uploaded Media ({items.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 bg-card border border-line rounded-input items-start group shadow-xs"
              >
                {/* Media thumbnail */}
                <div className="relative w-20 h-20 rounded bg-ink-950 flex-shrink-0 overflow-hidden border border-line">
                  {item.type === 'image' ? (
                    <img
                      src={item.previewUrl}
                      alt={item.caption || `Evidence photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-card bg-ink-700">
                      <Film className="w-6 h-6 mb-1 text-primary-100" />
                      <span className="text-[9px] uppercase font-mono">Video</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 font-mono text-[9px] bg-ink-950/80 text-card px-1 rounded">
                    {item.captureSource}
                  </span>
                </div>

                {/* Details and caption */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-ink-950 truncate">
                      {item.file.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-ink-400 hover:text-status-rejected transition-colors p-1"
                      title="Remove media"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] font-mono text-ink-500">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB • {item.file.type.split('/')[1]?.toUpperCase() || item.type}
                  </p>

                  {/* Caption */}
                  {editingCaptionId === item.id ? (
                    <div className="pt-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item.caption || ''}
                        onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                        placeholder="Add descriptive note..."
                        className="w-full text-xs px-2 py-1 border border-line rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
                        maxLength={120}
                        autoFocus
                        onBlur={() => setEditingCaptionId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingCaptionId(null);
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingCaptionId(item.id)}
                      className="text-[11px] text-primary-700 hover:underline flex items-center gap-1 pt-0.5"
                    >
                      <Tag className="w-3 h-3" />
                      {item.caption ? (
                        <span className="truncate italic">"{item.caption}"</span>
                      ) : (
                        <span>Add note / caption</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

