import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase.js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import FinancialProjections from './pages/FinancialProjections';
import DataManagement from './pages/DataManagement';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import UserProfile from './components/UserProfile';
import theme from './theme';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user] = useAuthState(auth);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const appliedTheme = {
    ...theme,
    palette: {
      ...theme.palette,
      mode: darkMode ? 'dark' : 'light',
    },
  };

  return (
    <ThemeProvider theme={appliedTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <Router>
          <div className="flex flex-col min-h-screen">
            <Header />
            <IconButton
              sx={{ ml: 1, position: 'absolute', top: '10px', right: '10px' }}
              onClick={toggleDarkMode}
              color="inherit"
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
                <Route path="/projections" element={user ? <FinancialProjections /> : <Navigate to="/signin" />} />
                <Route path="/data" element={user ? <DataManagement /> : <Navigate to="/signin" />} />
                <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/signin" />} />
                <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
                <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;