import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
const ToastContext = createContext<(message: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState(''),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return (
    <ToastContext.Provider
      value={(text) => {
        clearTimeout(timer.current);
        setMessage(text);
        timer.current = setTimeout(() => setMessage(''), 5000);
      }}
    >
      {children}
      <div id="toast" role="status" aria-live="polite" className={message ? 'visible' : ''}>
        {message}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
