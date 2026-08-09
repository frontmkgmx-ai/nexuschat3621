import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full bg-[#050505] text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h1>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Ocorreu um erro inesperado na aplicação. Você pode tentar recarregar a página para restaurar a conexão.
            </p>
            {this.state.error?.message && (
              <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 mb-6 text-left overflow-x-auto">
                <code className="text-xs text-red-300 font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="w-4 h-4" /> Recarregar
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
