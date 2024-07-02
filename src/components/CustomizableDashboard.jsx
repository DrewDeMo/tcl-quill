import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, Box, Button, TextField, MenuItem } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';

const CHART_TYPES = {
    LINE: 'line',
    BAR: 'bar',
    PIE: 'pie',
};

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DEFAULT_KPIS = [
    { id: 'income', title: 'Total Income', type: CHART_TYPES.LINE, dataKey: 'Total Income' },
    { id: 'expense', title: 'Total Expense', type: CHART_TYPES.BAR, dataKey: 'Total Expense' },
    { id: 'profit', title: 'Net Profit', type: CHART_TYPES.LINE, dataKey: 'Net Income' },
    { id: 'profitMargin', title: 'Profit Margin', type: CHART_TYPES.PIE, dataKey: 'NP Margin' },
];

function CustomizableDashboard() {
    const [user] = useAuthState(auth);
    const [data, setData] = useState([]);
    const [kpis, setKpis] = useState(DEFAULT_KPIS);
    const [newKpiTitle, setNewKpiTitle] = useState('');
    const [newKpiType, setNewKpiType] = useState(CHART_TYPES.LINE);
    const [newKpiDataKey, setNewKpiDataKey] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                const userDocRef = doc(collection(db, 'users'), user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setData(userData.financialData || []);
                    setKpis(userData.customKpis || DEFAULT_KPIS);
                }
            }
        };

        loadData();
    }, [user]);

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const newKpis = Array.from(kpis);
        const [reorderedItem] = newKpis.splice(result.source.index, 1);
        newKpis.splice(result.destination.index, 0, reorderedItem);

        setKpis(newKpis);
        updateKpisInFirestore(newKpis);
    };

    const updateKpisInFirestore = async (updatedKpis) => {
        if (user) {
            const userDocRef = doc(collection(db, 'users'), user.uid);
            await updateDoc(userDocRef, { customKpis: updatedKpis });
        }
    };

    const addNewKpi = () => {
        if (newKpiTitle && newKpiType && newKpiDataKey) {
            const newKpi = {
                id: `kpi-${Date.now()}`,
                title: newKpiTitle,
                type: newKpiType,
                dataKey: newKpiDataKey,
            };
            const updatedKpis = [...kpis, newKpi];
            setKpis(updatedKpis);
            updateKpisInFirestore(updatedKpis);
            setNewKpiTitle('');
            setNewKpiType(CHART_TYPES.LINE);
            setNewKpiDataKey('');
        }
    };

    const renderChart = (kpi) => {
        switch (kpi.type) {
            case CHART_TYPES.LINE:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <XAxis dataKey="Month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey={kpi.dataKey} stroke={CHART_COLORS[0]} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case CHART_TYPES.BAR:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <XAxis dataKey="Month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={kpi.dataKey} fill={CHART_COLORS[1]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case CHART_TYPES.PIE:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey={kpi.dataKey}
                                nameKey="Month"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
                Customizable Dashboard
            </Typography>
            <Paper sx={{ p: 2, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Add New KPI
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="KPI Title"
                            value={newKpiTitle}
                            onChange={(e) => setNewKpiTitle(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            select
                            label="Chart Type"
                            value={newKpiType}
                            onChange={(e) => setNewKpiType(e.target.value)}
                        >
                            {Object.values(CHART_TYPES).map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="Data Key"
                            value={newKpiDataKey}
                            onChange={(e) => setNewKpiDataKey(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Button variant="contained" onClick={addNewKpi} fullWidth>
                            Add KPI
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="kpis">
                    {(provided) => (
                        <Grid container spacing={4} {...provided.droppableProps} ref={provided.innerRef}>
                            {kpis.map((kpi, index) => (
                                <Draggable key={kpi.id} draggableId={kpi.id} index={index}>
                                    {(provided) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                            <Paper sx={{ p: 2, height: '100%' }}>
                                                <Typography variant="h6" gutterBottom>
                                                    {kpi.title}
                                                </Typography>
                                                {renderChart(kpi)}
                                            </Paper>
                                        </Grid>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </Grid>
                    )}
                </Droppable>
            </DragDropContext>
        </Box>
    );
}

export default CustomizableDashboard;
