import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard() {
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }} className="fade-in">
      <Typography variant="h4" gutterBottom fontWeight={300} color="text.primary">
        Financial Dashboard
      </Typography>
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      <Paper sx={{ p: 3, mb: 4 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} alignItems="center">
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
          </Grid>
        </LocalizationProvider>
      </Paper>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Income vs Expense Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                <Legend />
                <Line type="monotone" dataKey="Total Income" stroke="#8884d8" />
                <Line type="monotone" dataKey="Total Expense" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Monthly Net Income
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                <Legend />
                <Bar dataKey="Net Income" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;