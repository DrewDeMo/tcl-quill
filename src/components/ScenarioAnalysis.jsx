import React, { useState } from 'react';
import { Typography, Paper, TextField, Button, Grid } from '@mui/material';

function ScenarioAnalysis({ data, onAnalyze }) {
  const [incomeGrowth, setIncomeGrowth] = useState(5);
  const [expenseGrowth, setExpenseGrowth] = useState(3);
  const [projectionMonths, setProjectionMonths] = useState(12);

  const handleAnalyze = () => {
    const lastMonth = data[data.length - 1];
    const projections = [];

    for (let i = 1; i <= projectionMonths; i++) {
      const projectedMonth = {
        Month: `Projected ${i}`,
        'Total Income': (parseFloat(lastMonth['Total Income']) * (1 + incomeGrowth / 100) ** i).toFixed(2),
        'Total COGS': (parseFloat(lastMonth['Total COGS']) * (1 + expenseGrowth / 100) ** i).toFixed(2),
        'Total Expense': (parseFloat(lastMonth['Total Expense']) * (1 + expenseGrowth / 100) ** i).toFixed(2),
      };
      projectedMonth['Gross Profit'] = (projectedMonth['Total Income'] - projectedMonth['Total COGS']).toFixed(2);
      projectedMonth['Net Income'] = (projectedMonth['Gross Profit'] - projectedMonth['Total Expense']).toFixed(2);
      projections.push(projectedMonth);
    }

    onAnalyze(projections);
  };

  return (
    <Paper className="p-4">
      <Typography variant="h6" gutterBottom>
        Scenario Analysis
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Income Growth (%)"
            type="number"
            value={incomeGrowth}
            onChange={(e) => setIncomeGrowth(parseFloat(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Expense Growth (%)"
            type="number"
            value={expenseGrowth}
            onChange={(e) => setExpenseGrowth(parseFloat(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Projection Months"
            type="number"
            value={projectionMonths}
            onChange={(e) => setProjectionMonths(parseInt(e.target.value))}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleAnalyze}>
            Analyze Scenario
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default ScenarioAnalysis;