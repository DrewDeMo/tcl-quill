import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6 }}>
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} TCL Marketing. All rights reserved.
      </Typography>
    </Box>
  );
}

export default Footer;