import React from 'react';
import { Typography, Box } from '@mui/material';

const Footer = () => {
  return (
    <Box className="footer" sx={{ p: 2, backgroundColor: 'var(--primary-color)', color: 'var(--secondary-color)' }}>
      <Typography variant="body2" align="center">
        &copy; {new Date().getFullYear()} Financial Projection App. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
