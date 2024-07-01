import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { TextField, Button, Typography, Paper, Box, Grid, CssBaseline, useMediaQuery } from '@mui/material';
import { LogIn, Mail, Lock } from 'react-feather';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';

const SignIn = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: '#FF9800', // Orange color
          },
          background: {
            default: prefersDarkMode ? '#303030' : '#f5f5f5',
            paper: prefersDarkMode ? '#424242' : '#ffffff',
          },
          text: {
            primary: prefersDarkMode ? '#ffffff' : '#000000',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h4: {
            fontWeight: 700,
            color: '#ffffff',
          },
          body1: {
            fontWeight: 400,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
        },
      }),
    [prefersDarkMode],
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container component="main" sx={{ height: '100%' }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: 'url(https://source.unsplash.com/random?finance)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) => t.palette.background.default,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Grid
          item
          xs={12}
          sm={8}
          md={5}
          component={Paper}
          elevation={6}
          square
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              my: 4,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
              Sign In
            </Typography>
            {error && (
              <Typography color="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Typography>
            )}
            <Box component="form" noValidate onSubmit={handleSignIn} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: <Mail size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />,
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: <Lock size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />,
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                startIcon={<LogIn />}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

export default SignIn;
