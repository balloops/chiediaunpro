import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Semplice per catturare crash totali dell'app
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Initializing state as a class property
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("CRITICAL APP ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '40px', fontFamily: 'sans-serif', textAlign: 'center'}}>
          <h1 style={{color: '#ef4444'}}>Qualcosa è andato storto 😔</h1>
          <p>L'applicazione ha riscontrato un errore critico.</p>
          <pre style={{background: '#f1f5f9', padding: '20px', borderRadius: '8px', overflow: 'auto', textAlign: 'left', margin: '20px auto', maxWidth: '800px'}}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}
          >
            Ricarica Pagina
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);