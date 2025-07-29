import React from 'react';
import { Platform } from 'react-native';
import { Button } from 'react-native-paper';

interface WebImagePickerProps {
  onImageSelected: (imageUri: string) => void;
  onError?: (error: string) => void;
}

const WebImagePicker: React.FC<WebImagePickerProps> = ({ onImageSelected, onError }) => {
  const pickImage = () => {
    if (Platform.OS === 'web') {
      // Create file input for web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.multiple = true;
      
      input.onchange = (event: any) => {
        const files = event.target.files;
        if (files && files.length > 0) {
          const file = files[0];
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              onImageSelected(e.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    } else {
      // For native platforms, you would use expo-image-picker here
      onError?.('Image picker not available on this platform');
    }
  };

  return (
    <Button mode="contained" onPress={pickImage}>
      Pick Image/Video
    </Button>
  );
};

export default WebImagePicker;