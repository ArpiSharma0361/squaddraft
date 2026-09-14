import React from 'react';
import { ArenaFallback } from './ArenaFallback';

/**
 * Fault-isolation boundary for 3D Arena presentation components.
 * Prevents WebGL, Three.js, or canvas render errors from crashing core HTML application controls.
 */
export class ArenaErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('⚠️ [ArenaErrorBoundary] 3D Arena Presentation caught error:', error?.message, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If props provide fallbackData or roomState, render the high-polish 2D fallback
      if (this.props.roomState) {
        return (
          <div className="space-y-2">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-between">
              <span>🏟️ 3D Arena running in 2D Tactical Mode (GPU Fault Isolated)</span>
              <button
                onClick={this.handleRetry}
                className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] hover:bg-amber-300 cursor-pointer"
              >
                Retry 3D
              </button>
            </div>
            <ArenaFallback
              roomState={this.props.roomState}
              currentTurn={this.props.currentTurn || 1}
              activeStage={this.props.activeStage || 'draft'}
              role={this.props.role || 'spectator'}
            />
          </div>
        );
      }

      // Minimal safe fallback
      return (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="text-2xl">🏟️</div>
          <h4 className="text-sm font-black text-white uppercase tracking-wider">
            3D Arena Preview Unavailable
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All Admin controls, rosters, and matchmaking remain fully functional.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            Reload Preview
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
