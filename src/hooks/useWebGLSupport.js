import { useState, useEffect } from 'react';

export function useWebGLSupport() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const isSupported = Boolean(
        gl && (
          (window.WebGLRenderingContext && gl instanceof WebGLRenderingContext) ||
          (window.WebGL2RenderingContext && gl instanceof WebGL2RenderingContext)
        )
      );
      setHasWebGL(isSupported);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  return hasWebGL;
}
