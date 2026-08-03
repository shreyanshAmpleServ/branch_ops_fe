import { useCallback } from 'react';
import api from '../lib/api';
import { encryptObject, decryptObject } from '../lib/encryption';

export const useEncryptedApi = () => {
  const encryptedPost = useCallback(async <TReq, TRes>(url: string, data: TReq): Promise<TRes> => {
    const encrypted = encryptObject(data);
    const response = await api.post(url, { payload: encrypted });
    return response.data;
  }, []);

  const encryptedPut = useCallback(async <TReq, TRes>(url: string, data: TReq): Promise<TRes> => {
    const encrypted = encryptObject(data);
    const response = await api.put(url, { payload: encrypted });
    return response.data;
  }, []);

  const decryptResponse = useCallback(<T>(encryptedData: string): T => {
    return decryptObject<T>(encryptedData);
  }, []);

  return { encryptedPost, encryptedPut, decryptResponse };
};
