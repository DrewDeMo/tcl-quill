import React, { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import { calculateTotals, calculateProjections, calculateKPIs } from '../utils/calculations';
import DataInputForm from '../components/DataInputForm';
import ExportButton from '../components/ExportButton';
import DateRangeSelector from '../components/DateRangeSelector';

function FinancialProjections() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [projections, setProjections] = useState([]);
  const [totals, setTotals] = useState({});
  const [kpis, setKPIs] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const storedData = localStorage.getItem('financialData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setData(parsedData);
        setFilteredData(parsedData);
        updateCalculations(parsedData);
      } else {
        const response = await fetch('/src/data/sampleData.csv');
        const reader = response.body.getReader();
        const result = await reader.read();
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(result.value);
        const results = Papa.parse(csv, { header: true });
        setData(results.data);
        setFilteredData(results.data);
        updateCalculations(results.data);
        localStorage.setItem('financialData', JSON.stringify(results.data));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [startDate, endDate, data]);

  const updateCalculations = (newData) => {
    const calculatedTotals = calculateTotals(newData);
    setTotals(calculatedTotals);

    const calculatedProjections = calculateProjections(newData);
    setProjections(calculatedProjections);

    const calculatedKPIs = calculateKPIs(newData);
    setKPIs(calculatedKPIs);
  };

  const handleNewData = (newData) => {
    const updatedData = [...data, newData];
    setData(updatedData);
    updateCalculations(updatedData);
    localStorage.setItem('financialData', JSON.stringify(updatedData));
  };

  const filterData = () => {
    if (!startDate && !endDate) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => {
      const itemDate = dayjs(item.Month);
      const isAfterStart = startDate ? itemDate.isAfter(startDate) || itemDate.isSame(startDate) : true;
      const isBeforeEnd = endDate ? itemDate.isBefore(endDate) || itemDate.isSame(endDate) : true;
      return isAfterStart && isBeforeEnd;
    });

    setFilteredData(filtered);
    updateCalculations(filtered);
  };

  const combinedData = [...filteredData, ...projections];

  return (
    <div className="p-4">
      <Typography variant="h4" gutterBottom>
        Financial Projections
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => setStartDate(date)}
            onEndDateChange={(date) => setEndDate(date)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <DataInputForm onSubmit={handleNewData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Key Performance Indicators
            </Typography>
            <Typography>Gross Profit Margin: {kpis.grossProfitMargin}%</Typography>
            <Typography>Net Profit Margin: {kpis.netProfitMargin}%</Typography>
            <Typography>Operating Expense Ratio: {kpis.operatingExpenseRatio}%</Typography>
            <Typography>Revenue Growth Rate: {kpis.revenueGrowthRate}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Income and Expense Projections
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Total Income" stroke="#8884d8" />
                <Line type="monotone" dataKey="Total Expense" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Profit Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Gross Profit" fill="#8884d8" />
                <Bar dataKey="Net Income" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="financial projections table">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Total Income</TableCell>
                  <TableCell align="right">Total COGS</TableCell>
                  <TableCell align="right">Gross Profit</TableCell>
                  <TableCell align="right">Total Expense</TableCell>
                  <TableCell align="right">Net Income</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {combinedData.map((row, index) => (
                  <TableRow key={`${row.Month}-${index}`}>
                    <TableCell component="th" scope="row">
                      {row.Month}
                    </TableCell>
                    <TableCell align="right">{row['Total Income']}</TableCell>
                    <TableCell align="right">{row['Total COGS']}</TableCell>
                    <TableCell align="right">{row['Gross Profit']}</TableCell>
                    <TableCell align="right">{row['Total Expense']}</TableCell>
                    <TableCell align="right">{row['Net Income']}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12}>
          <ExportButton data={combinedData} fileName="financial_projections.csv" />
        </Grid>
      </Grid>
    </div>
  );
}

export default FinancialProjections;