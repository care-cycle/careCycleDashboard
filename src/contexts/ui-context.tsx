import { createContext, useContext, useState } from 'react'

interface UIContextType {
  isCallDetailsOpen: boolean
  setCallDetailsOpen: (open: boolean) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isCallDetailsOpen, setCallDetailsOpen] = useState(false)

  return (
    <UIContext.Provider value={{ isCallDetailsOpen, setCallDetailsOpen }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}