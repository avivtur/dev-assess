'use client';

import { Button } from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { type FC, useEffect, useState } from 'react';

const THEME_KEY = 'da-theme';
const DARK_CLASS = 'pf-v6-theme-dark';

const ThemeToggle: FC = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      document.documentElement.classList.add(DARK_CLASS);
      setDark(true);
    }
  }, []);

  const toggle = (): void => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add(DARK_CLASS);
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove(DARK_CLASS);
      localStorage.setItem(THEME_KEY, 'light');
    }
  };

  return (
    <Button variant="plain" onClick={toggle} aria-label="Toggle theme">
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
};

export default ThemeToggle;
