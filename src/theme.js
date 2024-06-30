import { createTheme } from '@mui/material/styles';

const commonSettings = {
  typography: {
    fontFamily: 'Open Sans, Arial, sans-serif',
    fontWeightThin: 100,
    fontWeightExtraLight: 200,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightSemiBold: 600,
    fontWeightBold: 700,
    fontWeightExtraBold: 800,
    fontWeightBlack: 900,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '16px',
          border: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h1: {
          fontWeight: 900,
        },
        h2: {
          fontWeight: 800,
        },
        h3: {
          fontWeight: 700,
        },
        h4: {
          fontWeight: 600,
        },
        h5: {
          fontWeight: 500,
        },
        h6: {
          fontWeight: 400,
        },
        subtitle1: {
          fontWeight: 300,
        },
        subtitle2: {
          fontWeight: 200,
        },
        body1: {
          fontWeight: 400,
        },
        body2: {
          fontWeight: 300,
        },
        button: {
          fontWeight: 600,
        },
        caption: {
          fontWeight: 200,
        },
        overline: {
          fontWeight: 100,
        },
      },
    },
  },
};

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#cc5500', // Company color
    },
    secondary: {
      main: '#ffffff', // White
    },
    background: {
      default: '#f4f4f4', // Light grey background
      paper: '#ffffff', // White paper
    },
    text: {
      primary: '#000000', // Black text
      secondary: '#333333', // Dark grey text
    },
  },
  ...commonSettings,
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#cc5500', // Company color
    },
    secondary: {
      main: '#ffffff', // White
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1e1e1e', // Dark paper
    },
    text: {
      primary: '#ffffff', // White text
      secondary: '#cccccc', // Light grey text
    },
  },
  ...commonSettings,
});

export { lightTheme, darkTheme };