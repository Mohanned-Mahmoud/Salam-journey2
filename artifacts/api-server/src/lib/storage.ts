import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize the R2 client
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME as string;

/**
 * Upload a file buffer directly to R2.
 * fileKey example: 'courses/course-123/lesson-1.mp4'
 *                  'products/product-456/guide.pdf'
 */
export async function uploadFile(fileKey: string, fileBuffer: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: contentType,
  });
  await r2Client.send(command);
  return { success: true, key: fileKey };
}

/**
 * Generate a presigned PUT URL so the browser can upload directly to R2.
 * fileKey example: 'courses/course-123/video.mp4'
 *                  'products/product-456/ebook.pdf'
 */
export async function getUploadUrl(fileKey: string, contentType: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a presigned GET URL (secure, time-limited) to view or download a file.
 * Default expiry: 1 hour (3600 seconds).
 */
export async function getFileUrl(fileKey: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  await r2Client.send(command);
  return { success: true };
}

// ─── Backward-compatible aliases for courses ────────────────────────────────
export const uploadCourseFile = (key: string, buf: Buffer, ct: string) => uploadFile(key, buf, ct);
export const getCourseFileUrl = (key: string, exp?: number) => getFileUrl(key, exp);
export const deleteCourseFile = (key: string) => deleteFile(key);
