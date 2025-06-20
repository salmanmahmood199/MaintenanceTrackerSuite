import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  initialIndex?: number;
  title?: string;
}

export function ImageGalleryModal({ 
  open, 
  onOpenChange, 
  images, 
  initialIndex = 0,
  title = "Images"
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-full h-[90vh] p-0 bg-black/95 border-0"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="absolute top-4 left-6 z-10 bg-black/80 rounded-lg px-4 py-2">
          <DialogTitle className="text-white text-lg">
            {title} ({currentIndex + 1} of {images.length})
          </DialogTitle>
        </DialogHeader>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-black/80 hover:bg-black/60 text-white"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Zoom controls */}
        <div className="absolute top-4 right-16 z-10 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/80 hover:bg-black/60 text-white"
            onClick={zoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/80 hover:bg-black/60 text-white"
            onClick={zoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Main image container */}
        <div className="flex items-center justify-center h-full w-full relative overflow-hidden">
          {images.length > 1 && (
            <>
              {/* Previous button */}
              <Button
                variant="ghost"
                size="lg"
                className="absolute left-4 z-10 bg-black/80 hover:bg-black/60 text-white rounded-full"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              {/* Next button */}
              <Button
                variant="ghost"
                size="lg"
                className="absolute right-4 z-10 bg-black/80 hover:bg-black/60 text-white rounded-full"
                onClick={goToNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Image */}
          <div className="flex items-center justify-center w-full h-full p-8">
            <img
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex gap-2 bg-black/80 rounded-lg p-3 max-w-96 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoom(1);
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                    index === currentIndex 
                      ? "border-blue-500 scale-110" 
                      : "border-gray-500 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="absolute bottom-4 right-4 z-10 text-xs text-gray-400 bg-black/80 rounded px-2 py-1">
          Use arrow keys to navigate • ESC to close
        </div>
      </DialogContent>
    </Dialog>
  );
}