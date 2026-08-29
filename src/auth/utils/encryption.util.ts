import { createCipheriv, createDecipheriv, createHash } from 'crypto';

/**
 * AES-256-CBC encryption utility for passwords.
 * Uses a 256-bit key derived from the ENCRYPTION_KEY environment variable (or default secret).
 * Uses a deterministic IV derived from the key so that encrypting the same plain password
 * yields the exact same encrypted ciphertext required for direct database string queries in stored procedures.
 */

const DEFAULT_SECRET = 'koperasi_secure_encryption_secret_key_32bytes!';

function getEncryptionKeyAndIv(secretKey?: string): { key: Buffer; iv: Buffer } {
  const secret = secretKey || process.env.ENCRYPTION_KEY || DEFAULT_SECRET;
  // Derive 32-byte key using SHA-256
  const key = createHash('sha256').update(secret).digest();
  // Derive 16-byte IV using MD5 of the key for deterministic IV matching stored procedure queries
  const iv = createHash('md5').update(key).digest();
  return { key, iv };
}

export function encryptPassword(plainText: string, secretKey?: string): string {
  if (!plainText) return plainText;
  const { key, iv } = getEncryptionKeyAndIv(secretKey);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptPassword(cipherText: string, secretKey?: string): string {
  if (!cipherText) return cipherText;
  const { key, iv } = getEncryptionKeyAndIv(secretKey);
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
