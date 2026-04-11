// shader-switcher.ts — Dispatcher for shader variants

import { initAuroraShader } from './aurora-shader';
import { initTopographicShader } from './shader-topographic';
import { initGradientMeshShader } from './shader-gradient-mesh';
import { initDeepSpaceShader } from './shader-deep-space';

export function initShader(canvas: HTMLCanvasElement, mode: string): boolean {
  switch (mode) {
    case 'topographic': return initTopographicShader(canvas);
    case 'gradient': return initGradientMeshShader(canvas);
    case 'space': return initDeepSpaceShader(canvas);
    case 'aurora':
    default: return initAuroraShader(canvas);
  }
}
