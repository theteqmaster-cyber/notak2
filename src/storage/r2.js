// src/storage/r2.js — Cloudflare R2 via AWS SDK v3
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.R2_BUCKET;

/**
 * Upload a buffer to R2
 * @param {string} key - Object key (path in bucket)
 * @param {Buffer} buffer - File data
 * @param {string} mime - MIME type
 */
async function upload(key, buffer, mime) {
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mime,
  }));
}

/**
 * Generate a temporary signed download URL (1 hour by default)
 * @param {string} key
 * @param {number} expiresIn - seconds
 */
async function signedUrl(key, expiresIn = 3600) {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

/**
 * Delete an object from R2
 * @param {string} key
 */
async function remove(key) {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { upload, signedUrl, remove };
