import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Switch, Box, Button, Avatar } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const Header = ({ darkMode, toggleDarkMode }) => {
  const [user] = useAuthState(auth);

  return (
    <AppBar position="static" className="header">
      <Toolbar>
        <Typography variant="h6" className="project-title">
          Financial Projection App
        </Typography>
        <Box className="project-links" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Button color="inherit" component={Link} to="/">Dashboard</Button>
          <Button color="inherit" component={Link} to="/projections">Projections</Button>
          <Button color="inherit" component={Link} to="/data">Data Management</Button>
        </Box>
        <div className="project-icons">
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
          <Switch checked={darkMode} onChange={toggleDarkMode} />
          {user && (
            <IconButton color="inherit" component={Link} to="/profile">
              <Avatar alt={user.displayName || 'User'} src={user.photoURL || '/default-avatar.png'} />
            </IconButton>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
