import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip, useTheme } from '@mui/material';
import { Trash2, Edit, Save, X as Cancel, Plus, RefreshCw, ChevronUp, ChevronDown } from 'react-feather';
import { useFirebase } from '../hooks/useFirebase';
import { useAuth } from '../hooks/useAuth';
import { exportToCSV } from '../utils/exportData';
import dayjs from 'dayjs';

const INITIAL_ENTRY = {
  Month: '',
  'Total Income': '',
  'Total COGS': '',
  'Gross Profit': '',
  'Total Expense': '',
  'Net Income': '',
};

function DataManagement() {
  const theme = useTheme();
  const { user } = useAuth();
  const { getDocument, setDocument, loading, error } = useFirebase();
  const [data, setData] = useState([]);
  const [newEntry, setNewEntry] = useState(INITIAL_ENTRY);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const userData = await getDocument('users', user.uid);
        if (userData && userData.financialData) {
          setData(userData.financialData);
        }
      }
    };

    loadData();
  }, [user, getDocument]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEntry = async () => {
    if (!newEntry.Month) {
      alert("Month is required");
      return;
    }

    const updatedData = [...data, newEntry];
    try {
      await setDocument('users', user.uid, { financialData: updatedData });
      setData(updatedData);
      setNewEntry(INITIAL_ENTRY);
    } catch (err) {
      alert("Failed to add entry. Please try again.");
    }
  };

  const handleEditStart = (index) => {
    setEditingIndex(index);
    setNewEntry(data[index]);
  };

  const handleEditCancel = () => {
    setEditingIndex(-1);
    setNewEntry(INITIAL_ENTRY);
  };

  const handleEditSave = async (index) => {
    const updatedData = [...data];
    updatedData[index] = newEntry;
    try {
      await setDocument('users', user.uid, { financialData: updatedData });
      setData(updatedData);
      setEditingIndex(-1);
      setNewEntry(INITIAL_ENTRY);
    } catch (err) {
      alert("Failed to update entry. Please try again.");
    }
  };

  const handleDelete = async (index) => {
    const updatedData = data.filter((_, i) => i !== index);
    try {
      await setDocument('users', user.uid, { financialData: updatedData });
      setData(updatedData);
    } catch (err) {
      alert("Failed to delete entry. Please try again.");
    }
  };

  const handleClearData = async () => {
    try {
      await setDocument('users', user.uid, { financialData: [] });
      setData([]);
      setOpenClearDialog(false);
    } catch (err) {
      alert("Failed to clear data. Please try again.");
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'Month') {
          return sortConfig.direction === 'ascending'
            ? dayjs(a[sortConfig.key], 'MMMM YYYY').diff(dayjs(b[sortConfig.key], 'MMMM YYYY'))
            : dayjs(b[sortConfig.key], 'MMMM YYYY').diff(dayjs(a[sortConfig.key], 'MMMM YYYY'));
        } else {
          const aValue = parseFloat(a[sortConfig.key]);
          const bValue = parseFloat(b[sortConfig.key]);
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const handleExportData = () => {
    exportToCSV(data, 'financial_data');
  };

  const cardStyle = {
    p: 3,
    mb: 4,
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2,
    boxShadow: theme.shadows[3],
    transition: 'box-shadow 0.3s ease-in-out',
    '&:hover': {
      boxShadow: theme.shadows[6],
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }} className="fade-in">
      <Typography variant="h4" gutterBottom fontWeight={700} color="text.primary" sx={{ mb: 4 }}>
        Financial Data Management
      </Typography>

      <Paper sx={cardStyle}>
        <Typography variant="h6" gutterBottom>Data Operations</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshCw />}
              onClick={handleExportData}
              fullWidth
            >
              Export Data
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Trash2 />}
              onClick={() => setOpenClearDialog(true)}
              fullWidth
            >
              Clear All Data
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={cardStyle}>
        <Typography variant="h6" gutterBottom>Add New Entry</Typography>
        <Grid container spacing={2}>
          {Object.keys(newEntry).map((key) => (
            <Grid item xs={12} sm={6} md={2} key={key}>
              <TextField
                fullWidth
                label={key}
                name={key}
                value={newEntry[key]}
                onChange={handleInputChange}
                type={key === 'Month' ? 'text' : 'number'}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus />}
              onClick={handleAddEntry}
              fullWidth
            >
              Add Entry
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={cardStyle}>
        <Typography variant="h6" gutterBottom>Financial Data</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {Object.keys(INITIAL_ENTRY).map((key) => (
                  <TableCell key={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort(key)}>
                      {key}
                      {sortConfig.key === key && (
                        sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </Box>
                  </TableCell>
                ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow key={index}>
                  {Object.entries(row).map(([key, value]) => (
                    <TableCell key={key}>
                      {editingIndex === index ? (
                        <TextField
                          fullWidth
                          name={key}
                          value={newEntry[key]}
                          onChange={handleInputChange}
                          type={key === 'Month' ? 'text' : 'number'}
                        />
                      ) : (
                        key === 'Month' ? value : parseFloat(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    {editingIndex === index ? (
                      <>
                        <Tooltip title="Save">
                          <IconButton onClick={() => handleEditSave(index)} color="primary">
                            <Save />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton onClick={handleEditCancel} color="secondary">
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEditStart(index)} color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(index)} color="secondary">
                            <Trash2 />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={openClearDialog}
        onClose={() => setOpenClearDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Clear all data?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to clear all financial data? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClearData} color="error" autoFocus>
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DataManagement;
