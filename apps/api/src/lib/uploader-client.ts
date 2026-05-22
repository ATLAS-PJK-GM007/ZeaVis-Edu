import type { UploaderMetadata } from '@zeavis/shared';
import { env } from '../config/env';

export async function uploadImageToStorage(file: File): Promise<UploaderMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);

  const response = await fetch(`${env.uploaderBaseUrl}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with HTTP ${response.status}`);
  }

  const payload = await response.json() as Partial<UploaderMetadata>;

  if (!payload.public_id || !payload.download_url || !payload.file_name || !payload.mime_type || typeof payload.size_bytes !== 'number') {
    throw new Error('Upload response is missing required metadata');
  }

  return {
    public_id: payload.public_id,
    telegram_file_id: payload.telegram_file_id,
    telegram_file_unique_id: payload.telegram_file_unique_id,
    file_name: payload.file_name,
    mime_type: payload.mime_type,
    size_bytes: payload.size_bytes,
    file_type: payload.file_type ?? 'image',
    download_url: payload.download_url,
  };
}
