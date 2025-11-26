import { useEffect } from 'react';

export const useCursorBeam = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const beam = document.body;
      const afterElement = window.getComputedStyle(beam, '::after');
      
      // Update CSS custom properties for cursor position
      beam.style.setProperty('--cursor-x', `${e.clientX}px`);
      beam.style.setProperty('--cursor-y', `${e.clientY}px`);
      
      // Apply position to pseudo-element through transform
      const style = document.createElement('style');
      style.textContent = `
        body::after {
          left: ${e.clientX}px;
          top: ${e.clientY}px;
        }
      `;
      
      // Remove old style if exists
      const oldStyle = document.getElementById('cursor-beam-style');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      style.id = 'cursor-beam-style';
      document.head.appendChild(style);
      
      // Add active class to show beam
      beam.classList.add('cursor-active');
    };

    const handleMouseLeave = () => {
      document.body.classList.remove('cursor-active');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      const style = document.getElementById('cursor-beam-style');
      if (style) {
        style.remove();
      }
    };
  }, []);
};
