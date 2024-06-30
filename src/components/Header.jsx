import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Switch, Box, Button } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Header = ({ darkMode, toggleDarkMode }) => {
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
          <Button color="inherit" component={Link} to="/profile">Profile</Button>
        </Box>
        <div className="project-icons">
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
          <Switch checked={darkMode} onChange={toggleDarkMode} />
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
