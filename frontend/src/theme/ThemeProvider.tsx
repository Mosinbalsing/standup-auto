import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
type Theme = 'light' | 'dark';
const ThemeContext = createContext({
  theme: 'light' as Theme,
  reduced: false,
  setTheme: (_theme: Theme) => {},
  setReduced: (_value: boolean) => {},
});
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
      localStorage.getItem('sa-theme') === 'dark' ? 'dark' : 'light',
    ),
    [reduced, setReduced] = useState(() => localStorage.getItem('sa-reduced') === 'true');
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('sa-theme', theme);
  }, [theme]);
  useEffect(() => {
    document.body.classList.toggle('no-motion', reduced);
    localStorage.setItem('sa-reduced', String(reduced));
  }, [reduced]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, reduced, setReduced }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
