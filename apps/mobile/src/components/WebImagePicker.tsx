import React from 'react';
import { Platform } from 'react-native';
import { Button } from 'react-native-paper';

interface WebImagePickerProps {
  onImageSelected: (imageUri: string) => void;
  onError?: (error: string) => void;
}

const WebImagePicker: React.FC<WebImagePickerProps> = ({ onImageSelected, onError }) => {
  const pickImage = () => {
    try {
      // Create file input for web/mobile web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = false;
      input.style.display = 'none';
      
      // Add to document temporarily
      document.body.appendChild(input);
      
      input.onchange = (event: any) => {
        const files = event.target.files;
        if (files && files.length > 0) {
          const file = files[0];
          console.log('Image selected from gallery:', file.name, file.size);
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              console.log('Image processed successfully');
              onImageSelected(e.target.result as string);
            }
          };
          reader.onerror = () => {
            onError?.('Failed to process selected image');
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
      onError?.('Failed to open image picker: ' + (error as Error).message);
    }
  };

  return (
    <Button mode="outlined" onPress={pickImage} icon="image" style={{ flex: 1 }}>
      Pick Image
    </Button>
  );
};

export default WebImagePicker;