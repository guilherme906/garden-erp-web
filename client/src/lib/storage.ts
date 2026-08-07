/**
 * Upload de arquivo para S3 via backend
 */
export async function storagePut(
  key: string,
  data: Uint8Array | Buffer | ArrayBuffer,
  contentType?: string
): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append("key", key);
  const blob = new Blob([data as any], { type: contentType });
  formData.append("file", blob);

  const response = await fetch("/api/storage/put", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Obter URL assinada para download
 */
export async function storageGet(
  key: string,
  expiresIn?: number
): Promise<{ key: string; url: string }> {
  const params = new URLSearchParams();
  params.append("key", key);
  if (expiresIn) params.append("expiresIn", expiresIn.toString());

  const response = await fetch(`/api/storage/get?${params}`);

  if (!response.ok) {
    throw new Error(`Get failed: ${response.statusText}`);
  }

  return response.json();
}
