import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, MenuItem, Select, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, InputLabel, FormControl } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Edit, Trash2, X, Briefcase, ShoppingCart, CreditCard, Printer, Monitor, Smartphone, Wifi, FileText, Coffee, Inbox, Send, Users, Award, Zap } from 'react-feather';
import dayjs from 'dayjs';

const CHART_COLORS = {
    income: '#66BB6A',
    expense: '#EF5350',
    cashFlow: '#42A5F5',
    forecast: '#FFA726',
};

const TRANSACTION_CATEGORIES = [
    { name: 'Client Payments', icon: Briefcase, type: 'income' },
    { name: 'Ad Revenue', icon: DollarSign, type: 'income' },
    { name: 'Affiliate Income', icon: Users, type: 'income' },
    { name: 'Software Subscriptions', icon: CreditCard, type: 'expense' },
    { name: 'Print Advertising Costs', icon: Printer, type: 'expense' },
    { name: 'Digital Advertising Costs', icon: Monitor, type: 'expense' },
    { name: 'Mobile Advertising Costs', icon: Smartphone, type: 'expense' },
    { name: 'Internet and Utilities', icon: Wifi, type: 'expense' },
    { name: 'Office Supplies', icon: ShoppingCart, type: 'expense' },
    { name: 'Freelancer Payments', icon: Users, type: 'expense' },
    { name: 'Marketing Tools', icon: Zap, type: 'expense' },
    { name: 'Professional Development', icon: Award, type: 'expense' },
    { name: 'Miscellaneous Income', icon: Inbox, type: 'income' },
    { name: 'Miscellaneous Expense', icon: Send, type: 'expense' },
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
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTransactionId, setDeleteTransactionId] = useState(null);
    const [forecastMonths, setForecastMonths] = useState(6);
    const [cashFlowForecast, setCashFlowForecast] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

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
        const { name, value } = e.target;
        if (editingTransaction) {
            setEditingTransaction({ ...editingTransaction, [name]: value });
        } else {
            setNewTransaction({ ...newTransaction, [name]: value });
        }
    };

    const addTransaction = async () => {
        if (newTransaction.description && newTransaction.amount && newTransaction.category) {
            const transactionToAdd = {
                ...newTransaction,
                id: Date.now().toString(),
                amount: parseFloat(newTransaction.amount)
            };
            const updatedCashFlowData = [...cashFlowData, transactionToAdd];
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

            // Update Firestore
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

            // Update Firestore
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

    const generateCashFlowForecast = () => {
        const sortedData = [...cashFlowData].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
        const lastDate = sortedData.length > 0 ? dayjs(sortedData[sortedData.length - 1].date) : dayjs();

        const monthlyAverages = TRANSACTION_CATEGORIES.reduce((acc, category) => {
            const categoryTransactions = sortedData.filter(t => t.category === category.name);
            const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            acc[category.name] = total / Math.max(1, categoryTransactions.length);
            return acc;
        }, {});

        let forecastBalance = sortedData.length > 0 ? sortedData[sortedData.length - 1].balance : 0;
        const forecast = [];

        for (let i = 1; i <= forecastMonths; i++) {
            const forecastDate = lastDate.add(i, 'month');
            let monthlyIncome = 0;
            let monthlyExpense = 0;

            Object.entries(monthlyAverages).forEach(([category, average]) => {
                const categoryType = TRANSACTION_CATEGORIES.find(c => c.name === category).type;
                if (categoryType === 'income') {
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

    const getCategoryIcon = (categoryName) => {
        const category = TRANSACTION_CATEGORIES.find(cat => cat.name === categoryName);
        return category ? category.icon : FileText;
    };

    const getCategoryColor = (categoryName) => {
        const category = TRANSACTION_CATEGORIES.find(cat => cat.name === categoryName);
        return category && category.type === 'income' ? CHART_COLORS.income : CHART_COLORS.expense;
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
                            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date"
                                    type="date"
                                    name="date"
                                    value={editingTransaction ? editingTransaction.date : newTransaction.date}
                                    onChange={handleInputChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    value={editingTransaction ? editingTransaction.description : newTransaction.description}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Amount"
                                    type="number"
                                    name="amount"
                                    value={editingTransaction ? editingTransaction.amount : newTransaction.amount}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="transaction-type-label">Type</InputLabel>
                                    <Select
                                        labelId="transaction-type-label"
                                        label="Type"
                                        name="type"
                                        value={editingTransaction ? editingTransaction.type : newTransaction.type}
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="income">Income</MenuItem>
                                        <MenuItem value="expense">Expense</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="transaction-category-label">Category</InputLabel>
                                    <Select
                                        labelId="transaction-category-label"
                                        label="Category"
                                        name="category"
                                        value={editingTransaction ? editingTransaction.category : newTransaction.category}
                                        onChange={handleInputChange}
                                    >
                                        {TRANSACTION_CATEGORIES.map(category => (
                                            <MenuItem key={category.name} value={category.name}>{category.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                {editingTransaction ? (
                                    <>
                                        <Button variant="contained" color="primary" onClick={updateTransaction} startIcon={<Edit />}>
                                            Update Transaction
                                        </Button>
                                        <Button variant="outlined" color="secondary" onClick={() => setEditingTransaction(null)} startIcon={<X />} sx={{ ml: 2 }}>
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="contained" color="primary" onClick={addTransaction} startIcon={<DollarSign />}>
                                        Add Transaction
                                    </Button>
                                )}
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
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {calculateCashFlow().map((transaction) => {
                                        const CategoryIcon = getCategoryIcon(transaction.category);
                                        const categoryColor = getCategoryColor(transaction.category);
                                        return (
                                            <TableRow key={transaction.id}>
                                                <TableCell>{transaction.date}</TableCell>
                                                <TableCell>{transaction.description}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <CategoryIcon size={20} color={categoryColor} style={{ marginRight: '8px' }} />
                                                        {transaction.category}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                                        {transaction.type === 'income' ? (
                                                            <TrendingUp size={20} color={CHART_COLORS.income} style={{ marginRight: '4px' }} />
                                                        ) : (
                                                            <TrendingDown size={20} color={CHART_COLORS.expense} style={{ marginRight: '4px' }} />
                                                        )}
                                                        {transaction.type}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{transaction.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                        <IconButton onClick={() => editTransaction(transaction)} size="small" sx={{ mr: 1 }}>
                                                            <Edit size={18} />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => openDeleteConfirm(transaction.id)}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(239, 83, 80, 0.1)',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(239, 83, 80, 0.2)',
                                                                },
                                                            }}
                                                        >
                                                            <Trash2 size={18} color={CHART_COLORS.expense} />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
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
                                        {cashFlowData.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle1">Total Expenses</Typography>
                                    <Typography variant="h5" color={CHART_COLORS.expense}>
                                        {cashFlowData.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle1">Net Cash Flow</Typography>
                                    <Typography variant="h5" color={CHART_COLORS.cashFlow}>
                                        {(cashFlowData.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="subtitle1">Cash Flow Ratio</Typography>
                                    <Typography variant="h5" color={theme.palette.text.primary}>
                                        {(() => {
                                            const income = cashFlowData.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
                                            const expenses = cashFlowData.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
                                            return expenses !== 0 ? (income / expenses).toFixed(2) : 'N/A';
                                        })()}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
            <Dialog
                open={deleteConfirmOpen}
                onClose={closeDeleteConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete this transaction? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteConfirm} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={deleteTransaction} color="primary" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={closeSnackbar}
                message={snackbarMessage}
                action={
                    <React.Fragment>
                        <IconButton size="small" aria-label="close" color="inherit" onClick={closeSnackbar}>
                            <X />
                        </IconButton>
                    </React.Fragment>
                }
            />
        </Box>
    );
}

export default CashFlowManagement;
