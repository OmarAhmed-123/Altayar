import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    'home.welcome': 'Welcome, {name}',
    'home.discoverMessage': 'Discover amazing travel experiences',
    'home.searchPlaceholder': 'Search destinations...',
    'home.featuredPackages': 'Featured Packages',
    'home.seeAll': 'See All',
  },
  ar: {
    'home.welcome': 'أهلاً وسهلاً، {name}',
    'home.discoverMessage': 'اكتشف تجارب السفر المذهلة',
    'home.searchPlaceholder': 'ابحث عن الوجهات...',
    'home.featuredPackages': 'الباقات المميزة',
    'home.seeAll': 'عرض الكل',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('ar');

  const t = (key: string, params?: any): string => {
    const translation = translations[language as keyof typeof translations]?.[key] || key;
    
    if (params) {
      return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
