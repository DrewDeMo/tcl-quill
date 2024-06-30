import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button, useTheme } from '@mui/material';
import { Sun, Moon, User, Home, TrendingUp, Database } from 'react-feather';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const Header = ({ darkMode, toggleDarkMode }) => {
  const [user] = useAuthState(auth);
  const [scrolled, setScrolled] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <AppBar 
      position="sticky" 
      className={`header ${scrolled ? 'scrolled' : ''}`}
      sx={{
        transition: 'all 0.3s ease-in-out',
        py: scrolled ? 1 : 2,
        bgcolor: 'primary.main', // This ensures the AppBar uses the primary color
        boxShadow: scrolled ? 1 : 0,
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
          Financial Projection App
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/" 
            startIcon={<Home size={18} />}
            sx={{ color: 'white', mx: 1 }}
          >
            Dashboard
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/projections" 
            startIcon={<TrendingUp size={18} />}
            sx={{ color: 'white', mx: 1 }}
          >
            Projections
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/data" 
            startIcon={<Database size={18} />}
            sx={{ color: 'white', mx: 1 }}
          >
            Data Management
          </Button>
          <IconButton color="inherit" onClick={toggleDarkMode} sx={{ color: 'white', ml: 2 }}>
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          </IconButton>
          {user && (
            <IconButton color="inherit" component={Link} to="/profile" sx={{ color: 'white', ml: 1 }}>
              <User size={20} />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;