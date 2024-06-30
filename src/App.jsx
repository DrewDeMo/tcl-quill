import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase.js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FinancialProjections from './pages/FinancialProjections.jsx';
import DataManagement from './pages/DataManagement.jsx';
import SignUp from './components/SignUp.jsx';
import SignIn from './components/SignIn.jsx';
import UserProfile from './components/UserProfile.jsx';
import { lightTheme, darkTheme } from './theme.js';
import './App.css'; // Add this line to include custom CSS

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user] = useAuthState(auth);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const appliedTheme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={appliedTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <Router>
          <div className="flex flex-col min-h-screen">
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
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