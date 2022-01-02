const { spacing } = require('tailwindcss/defaultTheme');

module.exports = {
  mode: 'jit',
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        "base03": "#002b36",
        "base02": "#073642",
        "base01": "#586e75",
        "base00": "#657b83",
        "base0": "#839496",
        "base1": "#93a1a1",
        "base2": "#eee8d5",
        "base3": "#fdf6e3",
        "yellow-solar": "#b58900",
        "orange-solar": "#cb4b16",
        "red-solar": "#dc322f",
        "magenta-solar": "#d33682",
        "violet-solar": "#6c71c4",
        "blue-solar": "#268bd2",
        "cyan-solar": "#2aa198",
        "green-solar": "#859900"
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.base01'),
            a: {
              color: theme('colors.base03'),
              '&:hover': {
                color: theme('colors.violet-solar'),
              },
              '&:focus': {
                color: theme('colors.violet-solar'),
              },
              '&:visited': {
                color: theme('colors.blue-solar'),
              },

            },
            'h2,h3,h4': {
              'scroll-margin-top': spacing[32],
              color: theme('colors.green-solar'),
              'margin-bottom': spacing[2] 
            },
            code: { color: theme('colors.pink.500') },
            'blockquote p:first-of-type::before': false,
            'blockquote p:last-of-type::after': false,
          },
        },
        dark: {
          css: {
            color: theme('colors.base03'),
            a: {
              color: theme('colors.blue.400'),
              '&:hover': {
                color: theme('colors.violet-solar'),
              },
              '&:focus': {
                color: theme('colors.blue.600'),
              },
              code: { color: theme('colors.blue.400') },
            },
            blockquote: {
              borderLeftColor: theme('colors.gray.700'),
              color: theme('colors.gray.300'),
            },
            'h2,h3,h4': {
              color: theme('colors.gray.100'),
              'scroll-margin-top': spacing[32],
            },
            hr: { borderColor: theme('colors.gray.700') },
            ol: {
              li: {
                '&:before': { color: theme('colors.gray.500') },
              },
            },
            ul: {
              li: {
                '&:before': { backgroundColor: theme('colors.gray.500') },
              },
            },
            strong: { color: theme('colors.gray.300') },
            thead: {
              color: theme('colors.gray.100'),
            },
            tbody: {
              tr: {
                borderBottomColor: theme('colors.gray.700'),
              },
            },
          },
        },
      }),
    },
  },
  variants: {
    typography: ['dark'],
  },
  plugins: [require('@tailwindcss/typography')],
};
