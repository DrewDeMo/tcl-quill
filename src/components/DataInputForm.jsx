import React, { useState } from 'react';
import { TextField, Button, Grid, Paper, Typography, Alert } from '@mui/material';

function DataInputForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    month: '',
    totalIncome: '',
    totalCOGS: '',
    totalPayrollExpense: '',
    totalExpense: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.month) newErrors.month = 'Month is required';
    if (!formData.totalIncome) newErrors.totalIncome = 'Total Income is required';
    if (!formData.totalCOGS) newErrors.totalCOGS = 'Total COGS is required';
    if (!formData.totalPayrollExpense) newErrors.totalPayrollExpense = 'Total Payroll Expense is required';
    if (!formData.totalExpense) newErrors.totalExpense = 'Total Expense is required';

    const numericFields = ['totalIncome', 'totalCOGS', 'totalPayrollExpense', 'totalExpense'];
    numericFields.forEach(field => {
      if (isNaN(parseFloat(formData[field]))) {
        newErrors[field] = `${field.replace('total', 'Total')} must be a number`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const grossProfit = parseFloat(formData.totalIncome) - parseFloat(formData.totalCOGS);
      const netIncome = grossProfit - parseFloat(formData.totalExpense);
      const newData = {
        ...formData,
        'Gross Profit': grossProfit.toFixed(2),
        'Net Income': netIncome.toFixed(2),
        'GP Margin': ((grossProfit / parseFloat(formData.totalIncome)) * 100).toFixed(2),
        'NP Margin': ((netIncome / parseFloat(formData.totalIncome)) * 100).toFixed(2),
      };
      onSubmit(newData);
      setFormData({
        month: '',
        totalIncome: '',
        totalCOGS: '',
        totalPayrollExpense: '',
        totalExpense: '',
      });
    }
  };

  return (
    <Paper className="p-4">
      <Typography variant="h6" gutterBottom>
        Add Financial Data
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              error={!!errors.month}
              helperText={errors.month}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Income"
              name="totalIncome"
              type="number"
              value={formData.totalIncome}
              onChange={handleChange}
              error={!!errors.totalIncome}
              helperText={errors.totalIncome}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total COGS"
              name="totalCOGS"
              type="number"
              value={formData.totalCOGS}
              onChange={handleChange}
              error={!!errors.totalCOGS}
              helperText={errors.totalCOGS}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Payroll Expense"
              name="totalPayrollExpense"
              type="number"
              value={formData.totalPayrollExpense}
              onChange={handleChange}
              error={!!errors.totalPayrollExpense}
              helperText={errors.totalPayrollExpense}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Expense"
              name="totalExpense"
              type="number"
              value={formData.totalExpense}
              onChange={handleChange}
              error={!!errors.totalExpense}
              helperText={errors.totalExpense}
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary">
              Add Data
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}

export default DataInputForm;