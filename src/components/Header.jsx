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

function Header() {
  const [user] = useAuthState(auth);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} className="project-title">
          TCL Marketing
        </Typography>
        <div className="project-icons hidden">
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/projections">
                Financial Projections
              </Button>
              <Button color="inherit" component={Link} to="/data">
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
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
