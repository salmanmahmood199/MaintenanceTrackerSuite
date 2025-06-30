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
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="space-y-2">
          <Upload className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-sm text-slate-600">
            <span className="font-medium text-primary cursor-pointer">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
        </div>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-slate-200"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
