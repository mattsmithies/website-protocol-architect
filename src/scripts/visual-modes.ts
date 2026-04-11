// visual-modes.ts — Controls visual layer modes with smooth transitions
// Modes: Deep / Topology / Signal / Radiant

import gsap from 'gsap';
import type { ShaderState } from './aurora-shader';
import type { FlowFieldState } from './flow-field';

export interface VisualMode {
  name: string;
  label: string;
  contours: number;
  ridges: number;
  flow: boolean;
}

export const MODES: VisualMode[] = [
  { name: 'deep',     label: 'Deep',     contours: 0,   ridges: 0,   flow: false },
  { name: 'topology', label: 'Topology', contours: 1.0, ridges: 0,   flow: false },
  { name: 'signal',   label: 'Signal',   contours: 0.6, ridges: 0,   flow: true  },
  { name: 'radiant',  label: 'Radiant',  contours: 0.8, ridges: 1.0, flow: false },
];

const DEFAULT_MODE = 1; // Topology

export function initVisualModes(
  shader: ShaderState | null,
  flowField: FlowFieldState,
): { setMode: (index: number) => void; getMode: () => number } {
  let currentMode = DEFAULT_MODE;

  function applyMode(index: number, animate = true) {
    const mode = MODES[index];
    if (!mode) return;

    currentMode = index;

    // Update toggle UI
    document.querySelectorAll('[data-mode-dot]').forEach((dot, i) => {
      if (i === index) {
        (dot as HTMLElement).style.background = '#a78bfa';
        (dot as HTMLElement).style.transform = 'scale(1.3)';
      } else {
        (dot as HTMLElement).style.background = 'rgba(255,255,255,0.2)';
        (dot as HTMLElement).style.transform = 'scale(1)';
      }
    });

    // Update label
    const label = document.getElementById('mode-label');
    if (label) label.textContent = mode.label;

    if (!shader) return;

    if (animate) {
      // Smooth transition with GSAP
      const state = { contours: shader.getContours(), ridges: shader.getRidges() };
      gsap.to(state, {
        contours: mode.contours,
        ridges: mode.ridges,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: () => {
          shader.setContours(state.contours);
          shader.setRidges(state.ridges);
        },
      });
    } else {
      shader.setContours(mode.contours);
      shader.setRidges(mode.ridges);
    }

    // Toggle flow field
    flowField.setVisible(mode.flow);
  }

  // Keyboard shortcuts (1-4)
  document.addEventListener('keydown', (e) => {
    const num = parseInt(e.key);
    if (num >= 1 && num <= MODES.length) {
      applyMode(num - 1);
    }
  });

  // Click handlers for dots
  document.querySelectorAll('[data-mode-dot]').forEach((dot, i) => {
    (dot as HTMLElement).addEventListener('click', () => applyMode(i));
  });

  // Apply default mode immediately (no animation)
  applyMode(DEFAULT_MODE, false);

  return {
    setMode: (index) => applyMode(index),
    getMode: () => currentMode,
  };
}
