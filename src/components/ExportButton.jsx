import React from 'react';
import { Button } from '@mui/material';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

function ExportButton({ data, fileName }) {
  const handleExport = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, fileName);
  };

  return (
    <Button variant="contained" color="secondary" onClick={handleExport}>
      Export CSV
    </Button>
  );
}

export default ExportButton;