import { useEffect } from 'react';

import { getCSSVar } from '@/utils/ui';

export function useSwitchTheme() {
  const config = { theme: 'light' };

  useEffect(() => {
    document.body.classList.remove('light');
    document.body.classList.remove('dark');

    if (config.theme === 'dark') {
      document.body.classList.add('dark');
    } else if (config.theme === 'light') {
      document.body.classList.add('light');
    }

    const metaDescriptionDark = document.querySelector('meta[name="theme-color"][media]');
    const metaDescriptionLight = document.querySelector('meta[name="theme-color"]:not([media])');

    if (config.theme === 'auto') {
      metaDescriptionDark?.setAttribute('content', '#151515');
      metaDescriptionLight?.setAttribute('content', '#fafafa');
    } else {
      const themeColor = getCSSVar('--themeColor');
      metaDescriptionDark?.setAttribute('content', themeColor);
      metaDescriptionLight?.setAttribute('content', themeColor);
    }
  }, [config.theme]);
}
