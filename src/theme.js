import { createTheme } from '@mui/material/styles';

const commonSettings = {
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
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
