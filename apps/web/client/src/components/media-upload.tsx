import { useState, useCallback } from "react";
import { X, Upload, Image, Video } from "lucide-react";

interface MediaUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function MediaUpload({ 
  onFilesChange, 
  maxFiles = 5, 
  acceptedTypes = ['image/*', 'video/*'] 
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([]);

  const handleFileChange = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const fileArray = Array.from(fileList);
    const validFiles = fileArray.filter(file => {
      const isValidType = acceptedTypes.some(type => {
        if (type === 'image/*') return file.type.startsWith('image/');
        if (type === 'video/*') return file.type.startsWith('video/');
        return file.type === type;
      });
      
      // 10MB for images, 50MB for videos
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      return isValidType && file.size <= maxSize;
    });

    if (validFiles.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);

    // Create previews
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, { url: e.target?.result as string, type: 'image' }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setPreviews(prev => [...prev, { url, type: 'video' }]);
      }
    });
  }, [files, maxFiles, onFilesChange, acceptedTypes]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const removedPreview = previews[index];
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Cleanup video object URLs to prevent memory leaks
    if (removedPreview?.type === 'video' && removedPreview.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedPreview.url);
    }
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesChange(newFiles);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('media-upload')?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-foreground mb-2">
          Drag and drop images or videos here, or click to select
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files • Images: up to 10MB • Videos: up to 50MB
        </p>
        <input
          id="media-upload"
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              {preview.type === 'image' ? (
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ) : (
                <video
                  src={preview.url}
                  className="w-full h-32 object-cover rounded-lg border"
                  controls={false}
                  muted
                  preload="metadata"
                />
              )}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {preview.type === 'image' ? (
                  <Image className="inline h-3 w-3 mr-1" />
                ) : (
                  <Video className="inline h-3 w-3 mr-1" />
                )}
                {files[index]?.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Keep the old component name for backward compatibility
export const ImageUpload = MediaUpload;