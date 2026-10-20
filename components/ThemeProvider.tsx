'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'blue' | 'pink' | 'green' | 'purple'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: 'blue',
  setTheme: () => {},
})

export function ThemeProvider({ 
  children, 
  initialTheme 
}: { 
  children: React.ReactNode, 
  initialTheme: Theme 
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    // Set atribut data-theme di tag <html> biar CSS kita kebaca
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)