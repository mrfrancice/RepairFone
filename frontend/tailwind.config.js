/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      // Palette de couleurs inspirée de l'Afrique et de la Côte d'Ivoire
      colors: {
        // Couleurs primaires - Orange & Vert
        primary: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#E67700', // Orange principal - Soleil africain (WCAG AA compliant)
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100', // Orange profond
          950: '#BF360C',
        },
        secondary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#2E7D32', // Vert principal - Nature, espoir (WCAG AA compliant)
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32', // Vert forêt
          900: '#1B5E20',
          950: '#0D3F10',
        },

        // Couleurs tertiaires - Or & Bleu
        gold: {
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFF59D',
          300: '#FFF176',
          400: '#FFEE58',
          500: '#FFEB3B', // Jaune or
          600: '#FDD835',
          700: '#FBC02D', // Or/Doré - Soleil
          800: '#F9A825',
          900: '#F57F17',
          950: '#E65100',
        },
        ocean: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3', // Bleu océan
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0', // Bleu confiance
          900: '#0D47A1',
          950: '#01579B',
        },

        // Couleurs d'accent - Terre cuite & Jaune moutarde
        terracotta: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#F44336', // Rouge terre cuite
          600: '#E53935',
          700: '#D32F2F',
          800: '#C62828',
          900: '#B71C1C',
          950: '#8B0000',
        },
        mustard: {
          50: '#FFFBF0',
          100: '#FFF4D5',
          200: '#FFECB3',
          300: '#FFE082',
          400: '#FFD54F',
          500: '#FFCA28',
          600: '#FFC107', // Jaune moutarde
          700: '#FFB300',
          800: '#FFA000',
          900: '#FF8F00',
          950: '#FF6F00',
        },

        // Couleurs neutres avec une nuance chaleureuse africaine
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
          950: '#0A0A0A',
        },

        // Backgrounds avec teinte dorée pour le mode clair
        background: {
          light: {
            DEFAULT: '#FAFAFA',
            warm: '#FFF8E1', // Teinte dorée légère
            paper: '#FFFFFF',
          },
          dark: {
            DEFAULT: '#1A1A2E',
            elevated: '#25293C',
            paper: '#2D3142',
          }
        },

        // Couleurs sémantiques
        success: {
          light: '#66BB6A',
          DEFAULT: '#2E7D32', // WCAG AA compliant
          dark: '#1B5E20',
        },
        warning: {
          light: '#FFD54F',
          DEFAULT: '#FFC107',
          dark: '#F57C00',
        },
        error: {
          light: '#EF5350',
          DEFAULT: '#F44336',
          dark: '#C62828',
        },
        info: {
          light: '#64B5F6',
          DEFAULT: '#2196F3',
          dark: '#1565C0',
        },
      },

      // Typographie adaptée au marché africain (claire, moderne, lisible)
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        heading: [
          'Poppins',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Courier New',
          'monospace',
        ],
      },

      // Tailles de police optimisées pour mobile
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
        '5xl': ['3rem', { lineHeight: '1' }],            // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],         // 60px
      },

      // Espacements adaptés au mobile (touch-friendly)
      spacing: {
        '18': '4.5rem',    // 72px
        '22': '5.5rem',    // 88px
        '88': '22rem',     // 352px
        '128': '32rem',    // 512px
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // Bordures arrondies (design moderne africain)
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',    // 4px
        DEFAULT: '0.5rem',   // 8px
        'md': '0.75rem',     // 12px
        'lg': '1rem',        // 16px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '2rem',       // 32px
        'full': '9999px',
      },

      // Ombres adaptées au design africain (plus prononcées)
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
        'lg': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
        'xl': '0 12px 32px 0 rgba(0, 0, 0, 0.15)',
        '2xl': '0 16px 48px 0 rgba(0, 0, 0, 0.2)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'warm': '0 4px 16px 0 rgba(230, 119, 0, 0.15)', // Ombre orange chaleureuse (WCAG AA)
        'success': '0 4px 16px 0 rgba(46, 125, 50, 0.15)', // WCAG AA compliant
        'none': 'none',
      },

      // Animations et transitions
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      // Breakpoints adaptés au marché africain (mobile-first)
      screens: {
        'xs': '375px',   // Petits smartphones
        'sm': '640px',   // Smartphones standards
        'md': '768px',   // Tablettes portrait
        'lg': '1024px',  // Tablettes landscape / Desktop
        'xl': '1280px',  // Desktop large
        '2xl': '1536px', // Desktop très large
      },

      // Min-height pour zones touch-friendly
      minHeight: {
        'touch': '44px',  // iOS recommandation
        'touch-android': '48px',  // Android recommandation
      },

      // Largeurs max pour le contenu
      maxWidth: {
        'xs': '20rem',    // 320px
        'sm': '24rem',    // 384px
        'md': '28rem',    // 448px
        'lg': '32rem',    // 512px
        'xl': '36rem',    // 576px
        '2xl': '42rem',   // 672px
        '3xl': '48rem',   // 768px
        '4xl': '56rem',   // 896px
        '5xl': '64rem',   // 1024px
        '6xl': '72rem',   // 1152px
        '7xl': '80rem',   // 1280px
        'full': '100%',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
      },

      // Z-index pour la gestion des couches
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },

      // Backdrop blur
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [
    // Plugin pour les variants additionnels
    function({ addVariant }) {
      // Variant pour les états tactiles (mobile)
      addVariant('touch', '@media (hover: none)');
      addVariant('can-hover', '@media (hover: hover)');
    },
    // Plugin pour les utilitaires personnalisés
    function({ addUtilities }) {
      const newUtilities = {
        // Utilitaires pour touch-friendly design
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '.touch-target-android': {
          minHeight: '48px',
          minWidth: '48px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        // Safe area pour les devices avec notch
        '.safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-area': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        // Scroll smooth
        '.scroll-smooth-touch': {
          '-webkit-overflow-scrolling': 'touch',
          scrollBehavior: 'smooth',
        },
        // Gradient africain (orange vers or)
        '.bg-gradient-african': {
          backgroundImage: 'linear-gradient(135deg, #E67700 0%, #F9A825 100%)',
        },
        // Gradient coucher de soleil
        '.bg-gradient-sunset': {
          backgroundImage: 'linear-gradient(135deg, #E65100 0%, #F9A825 50%, #FBC02D 100%)',
        },
        // Gradient forêt
        '.bg-gradient-forest': {
          backgroundImage: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
}
