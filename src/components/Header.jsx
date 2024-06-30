import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button } from '@mui/material';
import { Sun, Moon, User, Home, TrendingUp, Database } from 'react-feather';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const Header = ({ darkMode, toggleDarkMode }) => {
  const [user] = useAuthState(auth);
  const [scrolled, setScrolled] = useState(false);

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
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
          Financial Projection App
        </Typography>
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/" 
            startIcon={<Home size={18} />}
          >
            Dashboard
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/projections" 
            startIcon={<TrendingUp size={18} />}
          >
            Projections
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/data" 
            startIcon={<Database size={18} />}
          >
            Data Management
          </Button>
        </Box>
        <IconButton color="inherit" onClick={toggleDarkMode}>
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
        </IconButton>
        {user && (
          <IconButton color="inherit" component={Link} to="/profile">
            <User size={20} />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;