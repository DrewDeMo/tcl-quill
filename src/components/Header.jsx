import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, IconButton, Box, Button, useTheme, useMediaQuery } from '@mui/material';
import { Sun, Moon, User, Home, TrendingUp, Database, BarChart2, Layout, DollarSign } from 'react-feather';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

// Import logo images
import desktopLogo from '../assets/images/desktop_logo.svg';
import desktopLogoDark from '../assets/images/desktop_logo_dark.svg';
import mobileLogo from '../assets/images/mobile_logo.svg';
import mobileLogoDark from '../assets/images/mobile_logo_dark.svg';

const Header = ({ darkMode, toggleDarkMode }) => {
  const [user] = useAuthState(auth);
  const [scrolled, setScrolled] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const getLogo = () => {
    if (isMobile) {
      return darkMode ? mobileLogoDark : mobileLogo;
    }
    return darkMode ? desktopLogoDark : desktopLogo;
  };

  const textColor = darkMode ? 'white' : 'text.primary';

  return (
    <AppBar
      position="sticky"
      sx={{
        transition: 'all 0.3s ease-in-out',
        py: scrolled ? 1 : 2,
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: 0,
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={getLogo()} alt="Logo" style={{ height: '40px' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isMobile && (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/"
                startIcon={<Home size={18} />}
                sx={{ color: textColor, mx: 1 }}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/projections"
                startIcon={<TrendingUp size={18} />}
                sx={{ color: textColor, mx: 1 }}
              >
                Projections
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/data"
                startIcon={<Database size={18} />}
                sx={{ color: textColor, mx: 1 }}
              >
                Data Management
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/predictive"
                startIcon={<BarChart2 size={18} />}
                sx={{ color: textColor, mx: 1 }}
              >
                Predictive Analytics
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/custom-dashboard"
                startIcon={<Layout size={18} />}
                sx={{ color: textColor, mx: 1 }}
              >
                Custom Dashboard
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/cash-flow"
                startIcon={<DollarSign size={18} />}
                sx={{ color: textColor, mx: 1 }}
              >
                Cash Flow
              </Button>
            </>
          )}
          <IconButton onClick={toggleDarkMode} sx={{ color: textColor, ml: isMobile ? 0 : 2 }}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
          {user && (
            <IconButton component={Link} to="/profile" sx={{ color: textColor, ml: 1 }}>
              <User size={20} />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
