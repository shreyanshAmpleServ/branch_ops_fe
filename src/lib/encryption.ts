import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'salesapp-dashboard-secret-key-2026';

export const encrypt = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

export const decrypt = (cipherText: string): string => {
  const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptObject = <T>(data: T): string => {
  return encrypt(JSON.stringify(data));
};

export const decryptObject = <T>(cipherText: string): T => {
  return JSON.parse(decrypt(cipherText));
};

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

export const generateRandomToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length).toString();
};
