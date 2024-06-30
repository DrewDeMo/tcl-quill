import React, { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Grid, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip, Box } from '@mui/material';
import { Delete, Edit, Save, Cancel, Plus, RefreshCcw, Trash2, ChevronUp, ChevronDown } from 'react-feather';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { styled } from '@mui/system';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
    color: theme.palette.primary.main,
  },
}));

const DataManagement = () => {
  const [user] = useAuthState(auth);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEntry, setNewEntry] = useState({
    Month: '',
    'Total Income': '',
    'Total COGS': '',
    'Gross Profit': '',
    'Total Expense': '',
    'Net Income': '',
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          setLoading(true);
          const userDocRef = doc(collection(db, 'users'), user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setData(userData.financialData || []);
          }
          setError(null);
        } catch (err) {
          console.error("Error loading data:", err);
          setError("Failed to load data. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEntry = async () => {
    if (!newEntry.Month) {
      setError("Month is required");
      return;
    }

    const updatedData = [...data, newEntry];
    try {
      setLoading(true);
      const userDocRef = doc(collection(db, 'users'), user.uid);
      await setDoc(userDocRef, { financialData: updatedData }, { merge: true });
      setData(updatedData);
      setNewEntry({
        Month: '',
        'Total Income': '',
        'Total COGS': '',
        'Gross Profit': '',
        'Total Expense': '',
        'Net Income': '',
      });
      setError(null);
    } catch (err) {
      console.error("Error adding entry:", err);
      setError("Failed to add entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateFakeData = () => {
    const fakeData = [];
    const startDate = new Date(2018, 0, 1);
    let totalIncome = 500000;
    let totalCOGS = 300000;
    let totalExpense = 150000;

    for (let i = 0; i < 60; i++) {
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const month = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

      totalIncome *= (1 + (Math.random() * 0.1 - 0.05));
      totalCOGS *= (1 + (Math.random() * 0.08 - 0.04));
      totalExpense *= (1 + (Math.random() * 0.06 - 0.03));

      const grossProfit = totalIncome - totalCOGS;
      const netIncome = grossProfit - totalExpense;

      fakeData.push({
        Month: month,
        'Total Income': totalIncome.toFixed(2),
        'Total COGS': totalCOGS.toFixed(2),
        'Gross Profit': grossProfit.toFixed(2),
        'Total Expense': totalExpense.toFixed(2),
        'Net Income': netIncome.toFixed(2),
      });
    }

    return fakeData;
  };

  const handleGenerateFakeData = async () => {
    const fakeData = generateFakeData();
    try {
      setLoading(true);
      const userDocRef = doc(collection(db, 'users'), user.uid);
      await setDoc(userDocRef, { financialData: fakeData }, { merge: true });
      setData(fakeData);
      setError(null);
    } catch (err) {
      console.error("Error generating fake data:", err);
      setError("Failed to generate fake data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(collection(db, 'users'), user.uid);
      await setDoc(userDocRef, { financialData: [] }, { merge: true });
      setData([]);
      setError(null);
      setOpenClearDialog(false);
    } catch (err) {
      console.error("Error clearing data:", err);
      setError("Failed to clear data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (index) => {
    setEditingIndex(index);
    setNewEntry(data[index]);
  };

  const handleEditCancel = () => {
    setEditingIndex(-1);
    setNewEntry({
      Month: '',
      'Total Income': '',
      'Total COGS': '',
      'Gross Profit': '',
      'Total Expense': '',
      'Net Income': '',
    });
  };

  const handleEditSave = async (index) => {
    const updatedData = [...data];
    updatedData[index] = newEntry;
    try {
      setLoading(true);
      const userDocRef = doc(collection(db, 'users'), user.uid);
      await setDoc(userDocRef, { financialData: updatedData }, { merge: true });
      setData(updatedData);
      setEditingIndex(-1);
      setNewEntry({
        Month: '',
        'Total Income': '',
        'Total COGS': '',
        'Gross Profit': '',
        'Total Expense': '',
        'Net Income': '',
      });
      setError(null);
    } catch (err) {
      console.error("Error updating entry:", err);
      setError("Failed to update entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    const updatedData = data.filter((_, i) => i !== index);
    try {
      setLoading(true);
      const userDocRef = doc(collection(db, 'users'), user.uid);
      await setDoc(userDocRef, { financialData: updatedData }, { merge: true });
      setData(updatedData);
      setError(null);
    } catch (err) {
      console.error("Error deleting entry:", err);
      setError("Failed to delete entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={300}>
        Financial Data Management
      </Typography>
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RefreshCcw />}
              onClick={handleGenerateFakeData}
            >
              Generate 5 Years of Fake Data
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Trash2 />}
              onClick={() => setOpenClearDialog(true)}
            >
              Clear All Data
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Add New Entry
        </Typography>
        <Grid container spacing={2} alignItems="center">
          {Object.keys(newEntry).map((key) => (
            <Grid item xs={12} sm={2} key={key}>
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
            >
              Add Entry
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {Object.keys(newEntry).map((key) => (
                  <StyledTableCell key={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort(key)}>
                      {key}
                      {sortConfig.key === key && (
                        sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </Box>
                  </StyledTableCell>
                ))}
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow key={index}>
                  {Object.entries(row).map(([key, value]) => (
                    <StyledTableCell key={key}>
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
                    </StyledTableCell>
                  ))}
                  <StyledTableCell>
                    {editingIndex === index ? (
                      <>
                        <Tooltip title="Save">
                          <StyledIconButton onClick={() => handleEditSave(index)} color="primary">
                            <Save />
                          </StyledIconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <StyledIconButton onClick={handleEditCancel} color="secondary">
                            <Cancel />
                          </StyledIconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Edit">
                          <StyledIconButton onClick={() => handleEditStart(index)} color="primary">
                            <Edit />
                          </StyledIconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <StyledIconButton onClick={() => handleDelete(index)} color="secondary">
                            <Delete />
                          </StyledIconButton>
                        </Tooltip>
                      </>
                    )}
                  </StyledTableCell>
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
          <Button onClick={handleClearData} color="secondary" autoFocus>
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DataManagement;
