import React from 'react';
import { Typography, Grid, Paper } from '@mui/material';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', income: 4000, expenses: 2400, profit: 1600 },
  { month: 'Feb', income: 3000, expenses: 1398, profit: 1602 },
  { month: 'Mar', income: 2000, expenses: 9800, profit: -7800 },
  { month: 'Apr', income: 2780, expenses: 3908, profit: -1128 },
  { month: 'May', income: 1890, expenses: 4800, profit: -2910 },
  { month: 'Jun', income: 2390, expenses: 3800, profit: -1410 },
];

const pieData = [
  { name: 'Income', value: 4000 },
  { name: 'Expenses', value: 2400 },
  { name: 'Profit', value: 1600 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard() {
  return (
    <div className="p-4">
      <Typography variant="h4" gutterBottom>
        Financial Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Income vs Expenses
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#8884d8" />
                <Bar dataKey="expenses" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Profit Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="profit" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Financial Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Key Metrics
            </Typography>
            <Typography variant="body1">
              Total Income: ${data.reduce((sum, item) => sum + item.income, 0)}
            </Typography>
            <Typography variant="body1">
              Total Expenses: ${data.reduce((sum, item) => sum + item.expenses, 0)}
            </Typography>
            <Typography variant="body1">
              Net Profit: ${data.reduce((sum, item) => sum + item.profit, 0)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

export default Dashboard;