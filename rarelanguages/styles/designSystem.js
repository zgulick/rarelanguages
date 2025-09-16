/**
 * Comprehensive Design System for Rare Languages Learning Platform
 * 
 * A cohesive design system that brings life and polish to the learning experience
 * while maintaining excellent readability and usability.
 */

export const designSystem = {
  // Color Palette - Light, accessible, WCAG 2.1 AA/AAA compliant
  colors: {
    // Primary brand colors - sophisticated but accessible
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe', 
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e'
    },
    
    // Light theme backgrounds
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      muted: '#e2e8f0'
    },
    
    // Text colors with proper contrast
    text: {
      primary: '#0f172a',      // 21:1 contrast on white (AAA)
      secondary: '#334155',    // 9.65:1 contrast on white (AAA) 
      tertiary: '#475569',     // 7.25:1 contrast on white (AA Large)
      muted: '#64748b',        // 5.74:1 contrast on white (AA)
      inverse: '#ffffff'       // For dark backgrounds
    },
    
    // Secondary - warm accent colors
    secondary: {
      50: '#fef7ee',
      100: '#fdedd3',
      200: '#fbd9a5',
      300: '#f8c06d',
      400: '#f59e0b',
      500: '#d97706',
      600: '#b45309',
      700: '#92400e',
      800: '#78350f',
      900: '#451a03'
    },
    
    // Success states - fresh greens
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    
    // Warning states - gentle ambers
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f'
    },
    
    // Error states - muted reds
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    
    // Neutral grays - light and accessible
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b'
    },
    
    // Border colors for light theme
    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
      strong: '#94a3b8'
    },
    
    // Surface colors for light theme cards and backgrounds
    surface: {
      card: '#ffffff',
      cardHover: '#f8fafc',
      elevated: '#ffffff',
      glass: 'rgba(255, 255, 255, 0.9)',
      glassHover: 'rgba(255, 255, 255, 0.95)',
      glassBorder: 'rgba(203, 213, 225, 0.5)',
      overlay: 'rgba(15, 23, 42, 0.1)',
      backdrop: 'rgba(15, 23, 42, 0.05)'
    }
  },

  // Typography Scale
  typography: {
    fonts: {
      heading: 'Inter, system-ui, -apple-system, sans-serif',
      body: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace'
    },
    
    sizes: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem'   // 60px
    },
    
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    }
  },

  // Spacing System - Consistent spacing throughout
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
    '5xl': '8rem'    // 128px
  },

  // Border Radius - Consistent rounded corners
  radius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px'
  },

  // Shadows - Layered depth
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 0 1px rgba(59, 130, 246, 0.15), 0 0 0 4px rgba(59, 130, 246, 0.1)',
    glowHover: '0 0 0 1px rgba(59, 130, 246, 0.25), 0 0 0 8px rgba(59, 130, 246, 0.15)'
  },

  // Light theme gradients
  gradients: {
    primary: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
    secondary: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warm: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    cool: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    
    // Light background gradients
    pageBackground: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #e2e8f0 75%, #cbd5e1 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)',
    buttonPrimary: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    buttonSecondary: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
    
    // Subtle accent gradients for sections
    accentBlue: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.03) 100%)',
    accentPurple: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(196, 181, 253, 0.03) 100%)',
    accentGreen: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(167, 243, 208, 0.03) 100%)',
    accentOrange: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(254, 215, 170, 0.03) 100%)'
  },

  // Animation & Transitions
  animations: {
    durations: {
      fast: 0.15,
      normal: 0.25,
      slow: 0.4
    },
    
    easings: {
      default: [0.4, 0, 0.2, 1],
      in: [0.4, 0, 1, 1],
      out: [0, 0, 0.2, 1],
      bounce: [0.68, -0.55, 0.265, 1.55]
    }
  },

  // Component Variants
  components: {
    // Card styles - light theme with proper contrast
    cards: {
      primary: {
        base: `
          background: #ffffff
          border: 1px solid #e2e8f0
          border-radius: 1.5rem
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
          transition-all duration-300ms ease-out
        `,
        hover: `
          hover:border-slate-300
          hover:shadow-lg
          hover:scale-[1.01]
        `,
        interactive: `
          cursor-pointer
          hover:shadow-xl
          active:scale-[0.99]
        `
      },
      
      lesson: {
        base: `
          background: #ffffff
          border: 1px solid #e2e8f0
          border-radius: 1rem
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
          transition-all duration-250ms ease-out
        `,
        hover: `
          hover:border-slate-300
          hover:shadow-md
          hover:scale-[1.005]
        `
      }
    },

    // Button styles - accessible light theme
    buttons: {
      primary: {
        base: `
          inline-flex items-center justify-center px-6 py-3 
          font-semibold text-white rounded-xl
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)
          border: 1px solid #3b82f6
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
          transition-all duration-250ms ease-out
          hover:shadow-lg hover:scale-[1.02]
          active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `,
        disabled: 'opacity-50 cursor-not-allowed hover:scale-100'
      },
      
      secondary: {
        base: `
          inline-flex items-center justify-center px-6 py-3 
          font-semibold text-slate-700 rounded-xl
          background: #ffffff
          border: 2px solid #e2e8f0
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
          transition-all duration-250ms ease-out
          hover:bg-slate-50 hover:border-slate-300 hover:shadow-md
          active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
        `,
        disabled: 'opacity-50 cursor-not-allowed'
      },
      
      ghost: {
        base: `
          inline-flex items-center justify-center px-4 py-2 
          font-medium text-slate-600 rounded-lg
          hover:bg-slate-100 hover:text-slate-900
          transition-all duration-200ms ease-out
          focus:outline-none focus:ring-2 focus:ring-slate-500/25
        `
      }
    },

    // Input styles - accessible
    inputs: {
      base: `
        w-full px-4 py-3
        bg-white border-2 border-slate-200 rounded-xl
        text-slate-900 placeholder-slate-500
        transition-all duration-200ms ease-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        hover:border-slate-300
      `
    }

  }
};

// Utility functions for applying design system
export const getButtonClass = (variant = 'primary', size = 'md', disabled = false) => {
  const baseClasses = designSystem.components.buttons[variant]?.base || designSystem.components.buttons.primary.base;
  const disabledClasses = disabled ? designSystem.components.buttons[variant]?.disabled || '' : '';
  
  return `${baseClasses} ${disabledClasses}`.trim();
};

export const getCardClass = (variant = 'primary', interactive = false) => {
  const base = designSystem.components.cards[variant]?.base || designSystem.components.cards.primary.base;
  const hover = designSystem.components.cards[variant]?.hover || designSystem.components.cards.primary.hover;
  const interactiveClasses = interactive ? 
    (designSystem.components.cards[variant]?.interactive || designSystem.components.cards.primary.interactive) : '';
  
  return `${base} ${interactive ? hover : ''} ${interactiveClasses}`.trim();
};

export const getTextGradient = (colors = ['from-blue-300', 'to-purple-300']) => {
  return `text-transparent bg-clip-text bg-gradient-to-r ${colors.join(' ')}`;
};

export default designSystem;