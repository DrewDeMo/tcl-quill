import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, Button, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import * as tf from '@tensorflow/tfjs';
import { TrendingUp, RefreshCw } from 'react-feather';

const CHART_COLORS = {
    income: '#66BB6A',
    expense: '#EF5350',
    profit: '#42A5F5',
};

function PredictiveAnalytics() {
    const theme = useTheme();
    const [user] = useAuthState(auth);
    const [data, setData] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [predictionMonths, setPredictionMonths] = useState(12);
    const [model, setModel] = useState(null);

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
        if (data.length > 0) {
            trainModel();
        }
    }, [data]);

    const trainModel = async () => {
        const incomeData = data.map(d => parseFloat(d['Total Income']));
        const expenseData = data.map(d => parseFloat(d['Total Expense']));

        const incomeTensor = tf.tensor2d(incomeData, [incomeData.length, 1]);
        const expenseTensor = tf.tensor2d(expenseData, [expenseData.length, 1]);

        const incomeModel = tf.sequential();
        incomeModel.add(tf.layers.dense({ units: 1, inputShape: [1] }));
        incomeModel.compile({ loss: 'meanSquaredError', optimizer: 'adam' });

        const expenseModel = tf.sequential();
        expenseModel.add(tf.layers.dense({ units: 1, inputShape: [1] }));
        expenseModel.compile({ loss: 'meanSquaredError', optimizer: 'adam' });

        await incomeModel.fit(incomeTensor, incomeTensor, { epochs: 100 });
        await expenseModel.fit(expenseTensor, expenseTensor, { epochs: 100 });

        setModel({ income: incomeModel, expense: expenseModel });
    };

    const generatePredictions = async () => {
        if (!model) return;

        const lastIncome = parseFloat(data[data.length - 1]['Total Income']);
        const lastExpense = parseFloat(data[data.length - 1]['Total Expense']);

        const predictedData = [];

        for (let i = 1; i <= predictionMonths; i++) {
            const incomeInput = tf.tensor2d([lastIncome + i], [1, 1]);
            const expenseInput = tf.tensor2d([lastExpense + i], [1, 1]);

            const predictedIncome = model.income.predict(incomeInput).dataSync()[0];
            const predictedExpense = model.expense.predict(expenseInput).dataSync()[0];
            const predictedProfit = predictedIncome - predictedExpense;

            predictedData.push({
                Month: `Month ${data.length + i}`,
                'Total Income': predictedIncome.toFixed(2),
                'Total Expense': predictedExpense.toFixed(2),
                'Net Income': predictedProfit.toFixed(2),
            });
        }

        setPredictions(predictedData);
    };

    const handlePredictionMonthsChange = (event) => {
        setPredictionMonths(parseInt(event.target.value));
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
                Predictive Analytics
            </Typography>
            {error && (
                <Typography color="error" gutterBottom>
                    {error}
                </Typography>
            )}
            <Paper sx={{ ...cardStyle, mb: 4 }}>
                <Typography variant="h6" sx={cardTitleStyle}>
                    Prediction Settings
                </Typography>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Prediction Months"
                            type="number"
                            value={predictionMonths}
                            onChange={handlePredictionMonthsChange}
                            inputProps={{ min: 1, max: 120, step: 1 }}
                            InputProps={{
                                startAdornment: <TrendingUp size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button variant="contained" color="primary" onClick={generatePredictions} startIcon={<RefreshCw />} fullWidth>
                            Generate Predictions
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Paper sx={cardStyle}>
                        <Typography variant="h6" sx={cardTitleStyle}>
                            Financial Predictions
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={[...data, ...predictions]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="Month" />
                                <YAxis />
                                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                                <Legend />
                                <Line type="monotone" dataKey="Total Income" stroke={CHART_COLORS.income} />
                                <Line type="monotone" dataKey="Total Expense" stroke={CHART_COLORS.expense} />
                                <Line type="monotone" dataKey="Net Income" stroke={CHART_COLORS.profit} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default PredictiveAnalytics;
