import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'react-feather';
import { useFirebase } from '../hooks/useFirebase';
import { useAuth } from '../hooks/useAuth';
import DateRangeSelector from '../components/DateRangeSelector';
import { calculateTotals, calculateKPIs } from '../utils/calculations';

const CHART_COLORS = {
  income: '#66BB6A',
  expense: '#EF5350',
  profit: '#42A5F5',
  neutral: '#BDBDBD'
};

function Dashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const { getDocument, loading, error } = useFirebase();
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

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

  const filteredData = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return data;
    return data.filter(item => {
      const itemDate = new Date(item.Month);
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
  }, [data, dateRange]);

  const totals = useMemo(() => calculateTotals(filteredData), [filteredData]);
  const kpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);

  const pieChartData = [
    { name: 'Income', value: totals.totalIncome },
    { name: 'Expense', value: totals.totalExpense },
    { name: 'Net Income', value: totals.totalNetIncome },
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
        Financial Dashboard
      </Typography>

      <DateRangeSelector
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onStartDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
        onEndDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
      />

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Total Income
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70%' }}>
              <TrendingUp size={36} color={CHART_COLORS.income} />
              <Typography variant="h4" sx={{ ml: 2, fontWeight: 700 }}>
                {totals.totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Total Expense
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70%' }}>
              <TrendingDown size={36} color={CHART_COLORS.expense} />
              <Typography variant="h4" sx={{ ml: 2, fontWeight: 700 }}>
                {totals.totalExpense.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Net Income
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70%' }}>
              <DollarSign size={36} color={CHART_COLORS.profit} />
              <Typography variant="h4" sx={{ ml: 2, fontWeight: 700 }}>
                {totals.totalNetIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={cardStyle}>
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
          <Paper sx={cardStyle}>
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
          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={cardTitleStyle}>
              Key Performance Indicators
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Gross Profit Margin</Typography>
                <Typography variant="h5">{kpis.grossProfitMargin}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Net Profit Margin</Typography>
                <Typography variant="h5">{kpis.netProfitMargin}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Operating Expense Ratio</Typography>
                <Typography variant="h5">{kpis.operatingExpenseRatio}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Revenue Growth Rate</Typography>
                <Typography variant="h5">{kpis.revenueGrowthRate}%</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
