import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorageIcon from '@mui/icons-material/Storage';

function Header({ darkMode, toggleDarkMode }) {
  const [user] = useAuthState(auth);

  return (
    <AppBar position="static">
      <Toolbar className="header">
        <Typography variant="h6" component="div" className="project-title">
          TCL Marketing
        </Typography>
        <div className="project-icons">
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/" startIcon={<DashboardIcon />}>
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/projections" startIcon={<TrendingUpIcon />}>
                Financial Projections
              </Button>
              <Button color="inherit" component={Link} to="/data" startIcon={<StorageIcon />}>
                Data Management
              </Button>
              <IconButton
                color="inherit"
                component={Link}
                to="/profile"
                aria-label="user profile"
              >
                <AccountCircle />
              </IconButton>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/signin">
                Sign In
              </Button>
              <Button color="inherit" component={Link} to="/signup">
                Sign Up
              </Button>
            </>
          )}
          <IconButton
            className="theme-toggle-icon"
            onClick={toggleDarkMode}
            color="inherit"
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
