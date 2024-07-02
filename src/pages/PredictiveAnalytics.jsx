import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Paper, Grid, CircularProgress, Box, TextField, useTheme, Slider, FormControlLabel, Switch } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import * as tf from '@tensorflow/tfjs';
import { TrendingUp } from 'react-feather';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';

const CHART_COLORS = {
    income: '#66BB6A',
    expense: '#EF5350',
    profit: '#42A5F5',
    scenario1: '#FFA726',
    scenario2: '#BA68C8',
};

function PredictiveAnalytics() {
    const theme = useTheme();
    const [user] = useAuthState(auth);
    const [data, setData] = useState([]);
    const [predictions, setPredictions] = useState({
        baseScenario: [],
        scenario1: [],
        scenario2: [],
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [predictionMonths, setPredictionMonths] = useState(12);
    const [model, setModel] = useState(null);
    const [growthRate, setGrowthRate] = useState(5);
    const [inflationRate, setInflationRate] = useState(2);
    const [showScenarios, setShowScenarios] = useState(false);
    const [scenario1, setScenario1] = useState({ growthRate: 7, inflationRate: 3 });
    const [scenario2, setScenario2] = useState({ growthRate: 3, inflationRate: 4 });

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

    const generatePredictions = useCallback(async (customGrowthRate = growthRate, customInflationRate = inflationRate) => {
        if (!model || data.length === 0) return [];

        const lastMonth = data[data.length - 1];
        const projectedData = [];

        for (let i = 1; i <= predictionMonths; i++) {
            const projectedMonth = {
                Month: dayjs(lastMonth.Month, 'MMMM YYYY').add(i, 'month').format('MMMM YYYY'),
                'Total Income': (parseFloat(lastMonth['Total Income']) * (1 + customGrowthRate / 100) ** i).toFixed(2),
                'Total Expense': (parseFloat(lastMonth['Total Expense']) * (1 + customInflationRate / 100) ** i).toFixed(2),
            };
            projectedMonth['Net Income'] = (parseFloat(projectedMonth['Total Income']) - parseFloat(projectedMonth['Total Expense'])).toFixed(2);
            projectedData.push(projectedMonth);
        }

        return projectedData;
    }, [model, data, predictionMonths, growthRate, inflationRate]);

    const updatePredictions = useCallback(debounce(async () => {
        const baseScenario = await generatePredictions();
        let scenario1Data = [];
        let scenario2Data = [];

        if (showScenarios) {
            scenario1Data = await generatePredictions(scenario1.growthRate, scenario1.inflationRate);
            scenario2Data = await generatePredictions(scenario2.growthRate, scenario2.inflationRate);
        }

        setPredictions({
            baseScenario,
            scenario1: scenario1Data,
            scenario2: scenario2Data,
        });
    }, 300), [generatePredictions, showScenarios, scenario1, scenario2]);

    useEffect(() => {
        updatePredictions();
    }, [growthRate, inflationRate, predictionMonths, showScenarios, scenario1, scenario2, updatePredictions]);

    useEffect(() => {
        const historicalDataCount = Math.max(0, data.length - predictionMonths);
        const relevantHistoricalData = data.slice(historicalDataCount);
        const combinedData = [...relevantHistoricalData, ...predictions.baseScenario];
        setChartData(combinedData);
    }, [data, predictions, predictionMonths]);

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
                        <Typography gutterBottom>Growth Rate (%)</Typography>
                        <Slider
                            value={growthRate}
                            onChange={(e, newValue) => setGrowthRate(newValue)}
                            aria-labelledby="growth-rate-slider"
                            valueLabelDisplay="auto"
                            step={0.1}
                            marks
                            min={0}
                            max={10}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography gutterBottom>Inflation Rate (%)</Typography>
                        <Slider
                            value={inflationRate}
                            onChange={(e, newValue) => setInflationRate(newValue)}
                            aria-labelledby="inflation-rate-slider"
                            valueLabelDisplay="auto"
                            step={0.1}
                            marks
                            min={0}
                            max={10}
                        />
                    </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showScenarios}
                                onChange={(e) => setShowScenarios(e.target.checked)}
                                name="showScenarios"
                                color="primary"
                            />
                        }
                        label="Show Alternative Scenarios"
                    />
                </Box>
                {showScenarios && (
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" gutterBottom>Scenario 1</Typography>
                            <TextField
                                label="Growth Rate"
                                type="number"
                                value={scenario1.growthRate}
                                onChange={(e) => setScenario1({ ...scenario1, growthRate: parseFloat(e.target.value) })}
                                InputProps={{ inputProps: { min: 0, max: 20, step: 0.1 } }}
                                sx={{ mr: 2 }}
                            />
                            <TextField
                                label="Inflation Rate"
                                type="number"
                                value={scenario1.inflationRate}
                                onChange={(e) => setScenario1({ ...scenario1, inflationRate: parseFloat(e.target.value) })}
                                InputProps={{ inputProps: { min: 0, max: 20, step: 0.1 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" gutterBottom>Scenario 2</Typography>
                            <TextField
                                label="Growth Rate"
                                type="number"
                                value={scenario2.growthRate}
                                onChange={(e) => setScenario2({ ...scenario2, growthRate: parseFloat(e.target.value) })}
                                InputProps={{ inputProps: { min: 0, max: 20, step: 0.1 } }}
                                sx={{ mr: 2 }}
                            />
                            <TextField
                                label="Inflation Rate"
                                type="number"
                                value={scenario2.inflationRate}
                                onChange={(e) => setScenario2({ ...scenario2, inflationRate: parseFloat(e.target.value) })}
                                InputProps={{ inputProps: { min: 0, max: 20, step: 0.1 } }}
                            />
                        </Grid>
                    </Grid>
                )}
            </Paper>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Paper sx={cardStyle}>
                        <Typography variant="h6" sx={cardTitleStyle}>
                            Financial Predictions
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="Month" />
                                <YAxis />
                                <Tooltip formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                                <Legend />
                                <Line type="monotone" dataKey="Total Income" stroke={CHART_COLORS.income} />
                                <Line type="monotone" dataKey="Total Expense" stroke={CHART_COLORS.expense} />
                                <Line type="monotone" dataKey="Net Income" stroke={CHART_COLORS.profit} />
                                {showScenarios && predictions.scenario1.length > 0 && (
                                    <Line type="monotone" dataKey="Net Income" data={[...data.slice(-predictionMonths), ...predictions.scenario1]} stroke={CHART_COLORS.scenario1} name="Scenario 1" />
                                )}
                                {showScenarios && predictions.scenario2.length > 0 && (
                                    <Line type="monotone" dataKey="Net Income" data={[...data.slice(-predictionMonths), ...predictions.scenario2]} stroke={CHART_COLORS.scenario2} name="Scenario 2" />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default PredictiveAnalytics;
