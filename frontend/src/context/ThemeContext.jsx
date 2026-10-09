import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/lmsServices';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('vdlms_theme_mode') || 'dark';
  });

  const [platformSettings, setPlatformSettings] = useState({
    platform_name: 'Vaibhav Dhus LMS',
    platform_tagline: 'Modern, Secure & Scalable Learning Ecosystem',
    primary_color: '#6366f1',
    secondary_color: '#06b6d4',
    accent_color: '#10b981',
    bg_base: '#090d16',
    bg_surface: '#111827',
    watermark_enabled: true,
    watermark_opacity: 0.22,
    watermark_interval_seconds: 12
  });

  // Apply theme attributes and CSS variables
  const applyTokens = (settings, mode) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);

    if (settings.primary_color) {
      root.style.setProperty('--color-primary', settings.primary_color);
      // Convert hex to rgb for opacity utilities
      const hex = settings.primary_color.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
      }
    }
    if (settings.secondary_color) {
      root.style.setProperty('--color-secondary', settings.secondary_color);
    }
    if (settings.accent_color) {
      root.style.setProperty('--color-accent', settings.accent_color);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      if (data) {
        setPlatformSettings(prev => ({ ...prev, ...data }));
        applyTokens(data, themeMode);
      }
    } catch (e) {
      console.warn('Could not load remote theme settings, using defaults.', e);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem('vdlms_theme_mode', themeMode);
    applyTokens(platformSettings, themeMode);
  }, [themeMode, platformSettings]);

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleTheme,
        platformSettings,
        reloadSettings: loadSettings
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
