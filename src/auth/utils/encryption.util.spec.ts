import { describe, it, expect } from 'vitest';
import { encryptPassword, decryptPassword } from './encryption.util';

describe('EncryptionUtil', () => {
  const secretKey = 'test_secret_key_32_bytes_long_string!';

  it('should encrypt and decrypt a password correctly', () => {
    const plainText = 'MySecretPassword123!';
    const encrypted = encryptPassword(plainText, secretKey);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(plainText);

    const decrypted = decryptPassword(encrypted, secretKey);
    expect(decrypted).toEqual(plainText);
  });

  it('should produce identical ciphertext for identical input (deterministic for stored procedure matching)', () => {
    const plainText = 'SamePassword';
    const encrypted1 = encryptPassword(plainText, secretKey);
    const encrypted2 = encryptPassword(plainText, secretKey);

    expect(encrypted1).toEqual(encrypted2);
  });

  it('should return empty string if input is empty', () => {
    expect(encryptPassword('')).toEqual('');
    expect(decryptPassword('')).toEqual('');
  });
});
