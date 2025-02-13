import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      theme="light"
      expand={false}
      richColors
      offset="6rem"
      style={{
        zIndex: 999999,
      }}
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '400px',
        },
        duration: 4000,
      }}
      visibleToasts={1}
      closeButton={false}
    />
  )
}
