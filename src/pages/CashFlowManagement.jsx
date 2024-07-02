import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, MenuItem, Select, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, InputLabel, FormControl } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Edit, Trash2, X } from 'react-feather';
import dayjs from 'dayjs';
import * as tf from '@tensorflow/tfjs';

const CHART_COLORS = {
    income: '#66BB6A',
    expense: '#EF5350',
    cashFlow: '#42A5F5',
    forecast: '#FFA726',
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
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTransactionId, setDeleteTransactionId] = useState(null);
    const [forecastMonths, setForecastMonths] = useState(6);
    const [cashFlowForecast, setCashFlowForecast] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [cashBurnRate, setCashBurnRate] = useState(0);
    const [runway, setRunway] = useState(0);

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
        calculateCashBurnRateAndRunway();
    }, [cashFlowData, forecastMonths]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingTransaction) {
            setEditingTransaction({ ...editingTransaction, [name]: value });
        } else {
            setNewTransaction({ ...newTransaction, [name]: value });
        }
    };

    const addTransaction = async () => {
        if (newTransaction.description && newTransaction.amount) {
            const transactionToAdd = {
                ...newTransaction,
                id: Date.now().toString(),
                amount: parseFloat(newTransaction.amount)
            };
            const updatedCashFlowData = [...cashFlowData, transactionToAdd];
            setCashFlowData(updatedCashFlowData);

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
            showSnackbar('Transaction added successfully');
        }
    };

    const editTransaction = (transaction) => {
        setEditingTransaction(transaction);
    };

    const updateTransaction = async () => {
        if (editingTransaction) {
            const updatedCashFlowData = cashFlowData.map(t =>
                t.id === editingTransaction.id ? { ...editingTransaction, amount: parseFloat(editingTransaction.amount) } : t
            );
            setCashFlowData(updatedCashFlowData);

            if (user) {
                const userDocRef = doc(collection(db, 'users'), user.uid);
                await updateDoc(userDocRef, { cashFlowData: updatedCashFlowData });
            }

            setEditingTransaction(null);
            showSnackbar('Transaction updated successfully');
        }
    };

    const openDeleteConfirm = (id) => {
        setDeleteTransactionId(id);
        setDeleteConfirmOpen(true);
    };

    const closeDeleteConfirm = () => {
        setDeleteTransactionId(null);
        setDeleteConfirmOpen(false);
    };

    const deleteTransaction = async () => {
        if (deleteTransactionId) {
            const updatedCashFlowData = cashFlowData.filter(t => t.id !== deleteTransactionId);
            setCashFlowData(updatedCashFlowData);

            if (user) {
                const userDocRef = doc(collection(db, 'users'), user.uid);
                await updateDoc(userDocRef, { cashFlowData: updatedCashFlowData });
            }

            closeDeleteConfirm();
            showSnackbar('Transaction deleted successfully');
        }
    };

    const calculateCashFlow = () => {
        let balance = 0;
        return cashFlowData.map(transaction => {
            balance += transaction.type === 'income' ? transaction.amount : -transaction.amount;
            return { ...transaction, balance };
        });
    };
    const generateCashFlowForecast = async () => {
        if (cashFlowData.length < 2) return;

        const sortedData = [...cashFlowData].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
        const cashFlowValues = sortedData.map(d => d.type === 'income' ? d.amount : -d.amount);

        const inputTensor = tf.tensor2d(cashFlowValues, [cashFlowValues.length, 1]);
        const normalizedInput = inputTensor.sub(inputTensor.min()).div(inputTensor.max().sub(inputTensor.min()));

        const model = tf.sequential();
        model.add(tf.layers.lstm({ units: 8, inputShape: [1, 1] }));
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

        const xs = normalizedInput.slice([0, 0], [cashFlowValues.length - 1, 1]).expandDims(1);
        const ys = normalizedInput.slice([1, 0], [cashFlowValues.length - 1, 1]);

        await model.fit(xs, ys, { epochs: 100, verbose: 0 });

        const lastDataPoint = normalizedInput.slice([-1]).reshape([1, 1, 1]);
        const forecast = [];

        for (let i = 1; i <= forecastMonths; i++) {
            const pred = model.predict(lastDataPoint);
            const predValue = pred.mul(inputTensor.max().sub(inputTensor.min())).add(inputTensor.min()).dataSync()[0];
            forecast.push({
                date: dayjs(sortedData[sortedData.length - 1].date).add(i, 'month').format('YYYY-MM-DD'),
                amount: predValue,
                type: predValue >= 0 ? 'income' : 'expense'
            });
            lastDataPoint.dispose();
            lastDataPoint = pred.reshape([1, 1, 1]);
        }

        setCashFlowForecast(forecast);
    };

    const calculateCashBurnRateAndRunway = () => {
        if (cashFlowData.length < 2) return;

        const sortedData = [...cashFlowData].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
        const totalCashFlow = sortedData.reduce((sum, transaction) =>
            transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount, 0);
        const monthsDiff = dayjs(sortedData[sortedData.length - 1].date).diff(sortedData[0].date, 'month');

        const burnRate = -totalCashFlow / monthsDiff;
        setCashBurnRate(burnRate);

        const lastBalance = sortedData.reduce((balance, transaction) =>
            transaction.type === 'income' ? balance + transaction.amount : balance - transaction.amount, 0);
        const runwayMonths = burnRate > 0 ? lastBalance / burnRate : Infinity;
        setRunway(runwayMonths);
    };

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    const closeSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
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
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
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
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        name="type"
                                        value={newTransaction.type}
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="income">Income</MenuItem>
                                        <MenuItem value="expense">Expense</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" onClick={addTransaction}>
                                    Add Transaction
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Cash Flow Analytics
                        </Typography>
                        <Typography variant="body1">
                            Cash Burn Rate: ${cashBurnRate.toFixed(2)}/month
                        </Typography>
                        <Typography variant="body1">
                            Runway: {runway.toFixed(1)} months
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Forecast Months: {forecastMonths}
                        </Typography>
                        <TextField
                            type="number"
                            label="Forecast Months"
                            value={forecastMonths}
                            onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                            InputProps={{ inputProps: { min: 1, max: 24 } }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Cash Flow Forecast
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={[...calculateCashFlow(), ...cashFlowForecast]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="balance" stroke={CHART_COLORS.cashFlow} name="Actual Balance" />
                                <Line type="monotone" dataKey="amount" stroke={CHART_COLORS.forecast} name="Forecast" strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
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
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {calculateCashFlow().map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>{transaction.date}</TableCell>
                                            <TableCell>{transaction.description}</TableCell>
                                            <TableCell align="right">{transaction.amount.toFixed(2)}</TableCell>
                                            <TableCell>{transaction.type}</TableCell>
                                            <TableCell align="right">{transaction.balance.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <IconButton onClick={() => editTransaction(transaction)}>
                                                    <Edit />
                                                </IconButton>
                                                <IconButton onClick={() => openDeleteConfirm(transaction.id)}>
                                                    <Trash2 />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
            <Dialog
                open={deleteConfirmOpen}
                onClose={closeDeleteConfirm}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this transaction?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteConfirm}>Cancel</Button>
                    <Button onClick={deleteTransaction} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={closeSnackbar}
                message={snackbarMessage}
            />
        </Box>
    );
}

export default CashFlowManagement;
