import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { exportToCSV } from '../utils/exportData';
import dayjs from 'dayjs';
import { TrendingUp, Download, DollarSign, Percent } from 'react-feather';

function FinancialProjections() {
  const theme = useTheme();
  const [user] = useAuthState(auth);
  const [data, setData] = useState([]);
  const [projections, setProjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [growthRate, setGrowthRate] = useState(5);
  const [projectionMonths, setProjectionMonths] = useState(12);

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

  useEffect(() => {
    if (data.length > 0) {
      generateProjections();
    }
  }, [data, growthRate, projectionMonths]);

  const generateProjections = () => {
    const lastMonth = data[data.length - 1];
    const projectedData = [];

    for (let i = 1; i <= projectionMonths; i++) {
      const projectedMonth = {
        Month: dayjs(lastMonth.Month, 'MMMM YYYY').add(i, 'month').format('MMMM YYYY'),
        'Total Income': (parseFloat(lastMonth['Total Income']) * (1 + growthRate / 100) ** i).toFixed(2),
        'Total Expense': (parseFloat(lastMonth['Total Expense']) * (1 + growthRate / 100) ** i).toFixed(2),
      };
      projectedMonth['Net Income'] = (parseFloat(projectedMonth['Total Income']) - parseFloat(projectedMonth['Total Expense'])).toFixed(2);
      projectedData.push(projectedMonth);
    }

    setProjections(projectedData);
  };

  const handleGrowthRateChange = (event) => {
    setGrowthRate(parseFloat(event.target.value));
  };

  const handleProjectionMonthsChange = (event) => {
    setProjectionMonths(parseInt(event.target.value));
  };

  const handleExportToCSV = () => {
    exportToCSV(combinedData, 'financial_projections');
  };

  const calculateBreakEven = () => {
    if (data.length === 0) return null;

    const lastMonth = data[data.length - 1];
    const fixedCosts = parseFloat(lastMonth['Total Expense']) * 0.7; // Assuming 70% of expenses are fixed
    const variableCostsPerUnit = parseFloat(lastMonth['Total COGS']) / parseFloat(lastMonth['Total Income']);
    const pricePerUnit = 1; // Assuming price per unit is 1 for simplicity

    const breakEvenUnits = fixedCosts / (pricePerUnit - variableCostsPerUnit);
    const breakEvenRevenue = breakEvenUnits * pricePerUnit;

    return {
      units: breakEvenUnits.toFixed(2),
      revenue: breakEvenRevenue.toFixed(2),
    };
  };

  const combinedData = [...data, ...projections];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }} className="fade-in">
      <Typography variant="h4" gutterBottom fontWeight={700} color="text.primary">
        Financial Projections
      </Typography>
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      <Paper sx={{ p: 3, mb: 4, background: theme.palette.background.paper }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Growth Rate (%)"
              type="number"
              value={growthRate}
              onChange={handleGrowthRateChange}
              inputProps={{ min: -100, max: 100, step: 0.1 }}
              InputProps={{
                startAdornment: <Percent size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Projection Months"
              type="number"
              value={projectionMonths}
              onChange={handleProjectionMonthsChange}
              inputProps={{ min: 1, max: 120, step: 1 }}
              InputProps={{
                startAdornment: <TrendingUp size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="contained" color="primary" onClick={generateProjections} startIcon={<TrendingUp />}>
              Generate Projections
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="outlined" color="primary" onClick={handleExportToCSV} startIcon={<Download />}>
              Export to CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, background: theme.palette.background.paper }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Income and Expense Projections
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                <Legend />
                <Line type="monotone" dataKey="Total Income" stroke={theme.palette.primary.main} />
                <Line type="monotone" dataKey="Total Expense" stroke={theme.palette.error.main} />
                <Line type="monotone" dataKey="Net Income" stroke={theme.palette.success.main} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, background: theme.palette.background.paper }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Projection Data
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Total Income</TableCell>
                    <TableCell align="right">Total Expense</TableCell>
                    <TableCell align="right">Net Income</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projections.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {row.Month}
                      </TableCell>
                      <TableCell align="right">{parseFloat(row['Total Income']).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                      <TableCell align="right">{parseFloat(row['Total Expense']).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                      <TableCell align="right">{parseFloat(row['Net Income']).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, background: theme.palette.background.paper }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Break-Even Analysis
            </Typography>
            {calculateBreakEven() ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, background: theme.palette.background.default }}>
                    <Typography variant="subtitle1">Break-Even Units</Typography>
                    <Typography variant="h5" fontWeight={600}>{calculateBreakEven().units}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, background: theme.palette.background.default }}>
                    <Typography variant="subtitle1">Break-Even Revenue</Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {parseFloat(calculateBreakEven().revenue).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Typography>Insufficient data for break-even analysis</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FinancialProjections;