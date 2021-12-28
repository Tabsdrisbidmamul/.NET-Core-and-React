import React, { useEffect, useState } from 'react';
import { Button, Grid, Header } from 'semantic-ui-react';
import PhotoWidgetCropper from './PhotoWidgetCropper';
import PhotoWidgetDropZone from './PhotoWidgetDropZone';

interface Props {
  handlePhotoUpload: (file: Blob) => void;
  uploading: boolean;
}

export default function PhotoUploadWidget({ handlePhotoUpload, uploading }: Props) {
  const [files, setFiles] = useState<any>([]);

  const [cropper, setCropper] = useState<Cropper>();

  function onCrop() {
    if (cropper) {
      cropper.getCroppedCanvas().toBlob((blob) => handlePhotoUpload(blob!));
    }
  }

  useEffect(() => {
    return () => {
      files.forEach((file: any) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  return (
    <Grid>
      <Grid.Column width={4}>
        <Header sub color="teal" content="Step 1 - Add Photo" />
        <PhotoWidgetDropZone setFiles={setFiles} />
      </Grid.Column>

      <Grid.Column width={1} />

      <Grid.Column width={4}>
        <Header sub color="teal" content="Step 2 - Resize image" />
        {files && files.length > 0 && (
          <PhotoWidgetCropper
            setCropper={setCropper}
            imagePreview={files.length > 0 ? files[0].preview : ''}
          />
        )}
      </Grid.Column>

      <Grid.Column width={1} />

      <Grid.Column width={4}>
        <Header sub color="teal" content="Step 1 - Preview & Upload" />
        <>
          <div className="img-preview" style={{ minHeight: 200, overflow: 'hidden' }} />
          {files && files.length > 0 && (
            <Button.Group widths={2} style={{ marginTop: 10 }}>
              <Button onClick={onCrop} positive icon="check" loading={uploading} />
              <Button
                onClick={() => {
                  setFiles([]);
                  console.log('Called from PhotoUploadWidget', files);
                }}
                icon="close"
                disabled={uploading}
              />
            </Button.Group>
          )}
        </>
      </Grid.Column>
    </Grid>
  );
}
