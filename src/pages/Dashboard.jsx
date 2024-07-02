import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, useTheme, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import dayjs from 'dayjs';
import { TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw } from 'react-feather';

// Professional color palette for financial charts
const CHART_COLORS = {
  income: '#4CAF50',
  expense: '#F44336',
  profit: '#2196F3',
  neutral: '#9E9E9E'
};

function Dashboard() {
  const theme = useTheme();
  const [user] = useAuthState(auth);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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
            setFilteredData(userData.financialData || []);
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
    filterData();
  }, [startDate, endDate, data]);

  const filterData = () => {
    if (!startDate && !endDate) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => {
      const itemDate = dayjs(item.Month, 'MMMM YYYY');
      const isAfterStart = startDate ? itemDate.isAfter(startDate) || itemDate.isSame(startDate) : true;
      const isBeforeEnd = endDate ? itemDate.isBefore(endDate) || itemDate.isSame(endDate) : true;
      return isAfterStart && isBeforeEnd;
    });

    setFilteredData(filtered);
  };

  const calculateTotals = () => {
    return filteredData.reduce((acc, curr) => {
      acc.totalIncome += parseFloat(curr['Total Income']);
      acc.totalExpense += parseFloat(curr['Total Expense']);
      acc.totalProfit += parseFloat(curr['Net Income']);
      return acc;
    }, { totalIncome: 0, totalExpense: 0, totalProfit: 0 });
  };

  const totals = calculateTotals();

  const pieChartData = [
    { name: 'Income', value: totals.totalIncome },
    { name: 'Expense', value: totals.totalExpense },
    { name: 'Profit', value: totals.totalProfit },
  ];

  const cardStyle = {
    p: 3,
    height: '100%',
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2,
    boxShadow: theme.shadows[3],
    transition: 'box-shadow 0.3s ease-in-out',
    '&:hover': {
      boxShadow: theme.shadows[6],
    },
  };

  const cardTitleStyle = {
    fontWeight: 600,
    mb: 2,
    color: theme.palette.text.primary,
  };

  const handleApplyDateFilter = () => {
    filterData();
  };

  const handleResetDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredData(data);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }} className="fade-in">
      <Typography variant="h4" gutterBottom fontWeight={700} color="text.primary" sx={{ mb: 4 }}>
        Financial Dashboard
      </Typography>
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      <Paper id="date-filter-card" sx={{ ...cardStyle, mb: 4 }}>
        <Typography variant="h6" sx={cardTitleStyle}>
          Date Range Filter
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyDateFilter}
                startIcon={<Calendar />}
                fullWidth
              >
                Apply Filter
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleResetDateFilter}
                startIcon={<RefreshCw />}
                fullWidth
              >
                Reset Filter
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper id="total-income-card" sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Total Income
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70%' }}>
              <TrendingUp size={36} color={CHART_COLORS.income} />
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
                {totals.totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <TrendingUp size={16} color={CHART_COLORS.income} style={{ marginRight: 4 }} />
                5% increase from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper id="total-expense-card" sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Total Expense
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70%' }}>
              <TrendingDown size={36} color={CHART_COLORS.expense} />
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
                {totals.totalExpense.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <TrendingDown size={16} color={CHART_COLORS.expense} style={{ marginRight: 4 }} />
                2% decrease from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper id="net-profit-card" sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Net Profit
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70%' }}>
              <DollarSign size={36} color={CHART_COLORS.profit} />
              <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
                {totals.totalProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <TrendingUp size={16} color={CHART_COLORS.profit} style={{ marginRight: 4 }} />
                8% increase from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper id="financial-overview-card" sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Financial Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper id="income-expense-trend-card" sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Income vs Expense Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                <Legend />
                <Line type="monotone" dataKey="Total Income" stroke={CHART_COLORS.income} />
                <Line type="monotone" dataKey="Total Expense" stroke={CHART_COLORS.expense} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper id="monthly-net-income-card" sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Monthly Net Income
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                <Legend />
                <Bar dataKey="Net Income" fill={CHART_COLORS.profit} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
