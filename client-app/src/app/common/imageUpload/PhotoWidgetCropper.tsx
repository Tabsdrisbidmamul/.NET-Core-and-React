import React from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface Props {
  imagePreview: string;
  setCropper: (cropper: Cropper) => void;
}

export default function PhotoWidgetCropper({ imagePreview, setCropper }: Props) {
  console.log('Called from PhotoWidgetCropper', imagePreview);
  return (
    <Cropper
      src={imagePreview}
      style={{ height: 200, width: '100%' }}
      preview=".img-preview"
      // Cropper.js options
      initialAspectRatio={1}
      viewMode={1}
      guides={false}
      autoCropArea={1}
      background={false}
      onInitialized={(cropper) => setCropper(cropper)}
    />
  );
}
