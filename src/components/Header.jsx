import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Switch } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';

const Header = ({ darkMode, toggleDarkMode }) => {
  return (
    <AppBar position="static" className="header">
      <Toolbar>
        <Typography variant="h6" className="project-title">
          Financial Projection App
        </Typography>
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
