import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, MenuItem, Select } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'react-feather';
import dayjs from 'dayjs';

const CHART_COLORS = {
    income: '#66BB6A',
    expense: '#EF5350',
    cashFlow: '#42A5F5',
    forecast: '#FFA726',
};

const TRANSACTION_CATEGORIES = [
    'Salary',
    'Investments',
    'Sales',
    'Rent',
    'Utilities',
    'Supplies',
    'Marketing',
    'Other Income',
    'Other Expense',
];

function CashFlowManagement() {
    const theme = useTheme();
    const [user] = useAuthState(auth);
    const [data, setData] = useState([]);
    const [cashFlowData, setCashFlowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newTransaction, setNewTransaction] = useState({
        date: dayjs().format('YYYY-MM-DD'),
        description: '',
        amount: '',
        type: 'income',
        category: '',
    });
    const [forecastMonths, setForecastMonths] = useState(6);
    const [cashFlowForecast, setCashFlowForecast] = useState([]);

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
                        setCashFlowData(userData.cashFlowData || []);
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
        generateCashFlowForecast();
    }, [cashFlowData, forecastMonths]);

    const handleInputChange = (e) => {
        setNewTransaction({ ...newTransaction, [e.target.name]: e.target.value });
    };

    const addTransaction = async () => {
        if (newTransaction.description && newTransaction.amount && newTransaction.category) {
            const updatedCashFlowData = [...cashFlowData, newTransaction];
            setCashFlowData(updatedCashFlowData);

            // Update Firestore
            if (user) {
                const userDocRef = doc(collection(db, 'users'), user.uid);
                await updateDoc(userDocRef, { cashFlowData: updatedCashFlowData });
            }

            setNewTransaction({
                date: dayjs().format('YYYY-MM-DD'),
                description: '',
                amount: '',
                type: 'income',
                category: '',
            });
        }
    };

    const calculateCashFlow = () => {
        let balance = 0;
        return cashFlowData.map(transaction => {
            balance += transaction.type === 'income' ? parseFloat(transaction.amount) : -parseFloat(transaction.amount);
            return { ...transaction, balance };
        });
    };

    const generateCashFlowForecast = () => {
        const sortedData = [...cashFlowData].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
        const lastDate = sortedData.length > 0 ? dayjs(sortedData[sortedData.length - 1].date) : dayjs();

        const monthlyAverages = TRANSACTION_CATEGORIES.reduce((acc, category) => {
            const categoryTransactions = sortedData.filter(t => t.category === category);
            const total = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            acc[category] = total / Math.max(1, categoryTransactions.length);
            return acc;
        }, {});

        let forecastBalance = sortedData.length > 0 ? sortedData[sortedData.length - 1].balance : 0;
        const forecast = [];

        for (let i = 1; i <= forecastMonths; i++) {
            const forecastDate = lastDate.add(i, 'month');
            let monthlyIncome = 0;
            let monthlyExpense = 0;

            Object.entries(monthlyAverages).forEach(([category, average]) => {
                if (['Salary', 'Investments', 'Sales', 'Other Income'].includes(category)) {
                    monthlyIncome += average;
                } else {
                    monthlyExpense += average;
                }
            });

            forecastBalance += monthlyIncome - monthlyExpense;

            forecast.push({
                date: forecastDate.format('YYYY-MM-DD'),
                income: monthlyIncome,
                expense: monthlyExpense,
                balance: forecastBalance,
            });
        }

        setCashFlowForecast(forecast);
    };

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

    return (
        <Box sx={{ p: 4 }} className="fade-in">
            <Typography variant="h4" gutterBottom fontWeight={700} color="text.primary" sx={{ mb: 4 }}>
                Cash Flow Management
            </Typography>
            {error && (
                <Typography color="error" gutterBottom>
                    {error}
                </Typography>
            )}
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Paper sx={cardStyle}>
                        <Typography variant="h6" sx={cardTitleStyle}>
                            Add Transaction
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date"
                                    type="date"
                                    name="date"
                                    value={newTransaction.date}
                                    onChange={handleInputChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    value={newTransaction.description}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Amount"
                                    type="number"
                                    name="amount"
                                    value={newTransaction.amount}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Select
                                    fullWidth
                                    label="Type"
                                    name="type"
                                    value={newTransaction.type}
                                    onChange={handleInputChange}
                                >
                                    <MenuItem value="income">Income</MenuItem>
                                    <MenuItem value="expense">Expense</MenuItem>
                                </Select>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Select
                                    fullWidth
                                    label="Category"
                                    name="category"
                                    value={newTransaction.category}
                                    onChange={handleInputChange}
                                >
                                    {TRANSACTION_CATEGORIES.map(category => (
                                        <MenuItem key={category} value={category}>{category}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" color="primary" onClick={addTransaction} startIcon={<DollarSign />}>
                                    Add Transaction
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={cardStyle}>
                        <Typography variant="h6" sx={cardTitleStyle}>
                            Cash Flow Forecast
                        </Typography>
                        <TextField
                            fullWidth
                            label="Forecast Months"
                            type="number"
                            value={forecastMonths}
                            onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                            sx={{ mb: 2 }}
                        />
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={[...calculateCashFlow(), ...cashFlowForecast]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="balance" stroke={CHART_COLORS.cashFlow} name="Actual Balance" />
                                <Line type="monotone" dataKey="income" stroke={CHART_COLORS.income} name="Income" />
                                <Line type="monotone" dataKey="expense" stroke={CHART_COLORS.expense} name="Expense" />
                                <Line type="monotone" dataKey="balance" stroke={CHART_COLORS.forecast} name="Forecast Balance" strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={cardStyle}>
                        <Typography variant="h6" sx={cardTitleStyle}>
                            Transaction History
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Balance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {calculateCashFlow().map((transaction, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{transaction.date}</TableCell>
                                            <TableCell>{transaction.description}</TableCell>
                                            <TableCell>{transaction.category}</TableCell>
                                            <TableCell align="right">{parseFloat(transaction.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                            <TableCell>
                                                {transaction.type === 'income' ? (
                                                    <TrendingUp color={CHART_COLORS.income} />
                                                ) : (
                                                    <TrendingDown color={CHART_COLORS.expense} />
                                                )}
                                                {' '}
                                                {transaction.type}
                                            </TableCell>
                                            <TableCell align="right">{transaction.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={cardStyle}>
                        <Typography variant="h6" sx={cardTitleStyle}>
                            Cash Flow Analysis
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle1">Total Income</Typography>
                                    <Typography variant="h5" color={CHART_COLORS.income}>
                                        {cashFlowData.reduce((sum, t) => t.type === 'income' ? sum + parseFloat(t.amount) : sum, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle1">Total Expenses</Typography>
                                    <Typography variant="h5" color={CHART_COLORS.expense}>
                                        {cashFlowData.reduce((sum, t) => t.type === 'expense' ? sum + parseFloat(t.amount) : sum, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle1">Net Cash Flow</Typography>
                                    <Typography variant="h5" color={CHART_COLORS.cashFlow}>
                                        {(cashFlowData.reduce((sum, t) => t.type === 'income' ? sum + parseFloat(t.amount) : sum - parseFloat(t.amount), 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle1">Cash Flow Ratio</Typography>
                                    <Typography variant="h5" color={theme.palette.text.primary}>
                                        {(() => {
                                            const income = cashFlowData.reduce((sum, t) => t.type === 'income' ? sum + parseFloat(t.amount) : sum, 0);
                                            const expenses = cashFlowData.reduce((sum, t) => t.type === 'expense' ? sum + parseFloat(t.amount) : sum, 0);
                                            return expenses !== 0 ? (income / expenses).toFixed(2) : 'N/A';
                                        })()}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default CashFlowManagement;
