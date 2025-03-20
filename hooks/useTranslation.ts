import { useCallback } from 'react';
import { useTTS } from './useTTS';
import { getTranslation, Translation } from '@/config/i18n';

export function useTranslation() {
  const { currentLanguage } = useTTS();
  
  const t = useCallback(<
    K1 extends keyof Translation,
    K2 extends keyof Translation[K1],
    K3 extends keyof Translation[K1][K2]
  >(
    key1: K1,
    key2: K2,
    key3?: K3
  ): string => {
    const translation = getTranslation(currentLanguage);
    
    if (key3) {
      return translation[key1][key2][key3] as string;
    }
    
    return translation[key1][key2] as string;
  }, [currentLanguage]);

  return { t };
}