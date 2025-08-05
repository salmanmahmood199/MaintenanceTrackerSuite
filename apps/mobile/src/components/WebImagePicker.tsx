import React from 'react';
import { Platform } from 'react-native';
import { Button } from 'react-native-paper';

interface WebImagePickerProps {
  onImageSelected: (imageUri: string) => void;
  onError?: (error: string) => void;
  allowVideo?: boolean;
}

const WebImagePicker: React.FC<WebImagePickerProps> = ({ onImageSelected, onError, allowVideo = true }) => {
  const pickImage = () => {
    try {
      // Create file input for web/mobile web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = allowVideo ? 'image/*,video/*' : 'image/*';
      input.multiple = false;
      input.style.display = 'none';
      
      // Add to document temporarily
      document.body.appendChild(input);
      
      input.onchange = (event: any) => {
        const files = event.target.files;
        if (files && files.length > 0) {
          const file = files[0];
          console.log('Media selected from gallery:', file.name, file.size, file.type);
          
          // Validate file type
          const isImage = file.type.startsWith('image/');
          const isVideo = file.type.startsWith('video/');
          
          if (!isImage && !isVideo) {
            onError?.('Please select an image or video file only');
            return;
          }
          
          // Check file size (limit to 50MB)
          const maxSize = 50 * 1024 * 1024; // 50MB in bytes
          if (file.size > maxSize) {
            onError?.('File size too large. Please select a file smaller than 50MB');
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              console.log('Media processed successfully');
              onImageSelected(e.target.result as string);
            }
          };
          reader.onerror = () => {
            onError?.('Failed to process selected media file');
          };
          reader.readAsDataURL(file);
        }
        // Clean up
        document.body.removeChild(input);
      };
      
      input.oncancel = () => {
        document.body.removeChild(input);
      };
      
      // Trigger the file picker
      input.click();
    } catch (error) {
      console.error('Error picking image:', error);
      onError?.('Failed to open media picker: ' + (error as Error).message);
    }
  };

  return (
    <Button mode="outlined" onPress={pickImage} icon="image" style={{ flex: 1 }}>
      {allowVideo ? 'Pick Media' : 'Pick Image'}
    </Button>
  );
};

export default WebImagePicker;