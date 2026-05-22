import type { UploaderMetadata } from '@zeavis/shared';

export async function uploadImageToStorage(file: File): Promise<UploaderMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);

  const response = await fetch('https://upload.asepharyana.tech/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (!data.download_url) {
    throw new Error('Upload response missing download_url');
  }

  if (!data.public_id) {
    throw new Error('Upload response missing public_id');
  }

  return data as UploaderMetadata;
}
