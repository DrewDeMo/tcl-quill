import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { DollarSign, TrendingUp, TrendingDown } from 'react-feather';
import dayjs from 'dayjs';

const CHART_COLORS = {
    income: '#66BB6A',
    expense: '#EF5350',
    cashFlow: '#42A5F5',
};

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
    });

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

    const handleInputChange = (e) => {
        setNewTransaction({ ...newTransaction, [e.target.name]: e.target.value });
    };

    const addTransaction = async () => {
        if (newTransaction.description && newTransaction.amount) {
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
                                <TextField
                                    fullWidth
                                    select
                                    label="Type"
                                    name="type"
                                    value={newTransaction.type}
                                    onChange={handleInputChange}
                                >
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </TextField>
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
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={calculateCashFlow()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="balance" stroke={CHART_COLORS.cashFlow} />
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
            </Grid>
        </Box>
    );
}

export default CashFlowManagement;
