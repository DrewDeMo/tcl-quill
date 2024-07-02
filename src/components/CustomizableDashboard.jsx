import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, Box, Button, TextField, MenuItem, IconButton, Tooltip, useTheme, Popover } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Edit, Trash2, PlusCircle, Move, Palette } from 'react-feather';

const CHART_TYPES = {
    LINE: 'line',
    BAR: 'bar',
    PIE: 'pie',
};

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DEFAULT_KPIS = [
    { id: 'income', title: 'Total Income', type: CHART_TYPES.LINE, dataKey: 'Total Income', color: DEFAULT_COLORS[0] },
    { id: 'expense', title: 'Total Expense', type: CHART_TYPES.BAR, dataKey: 'Total Expense', color: DEFAULT_COLORS[1] },
    { id: 'profit', title: 'Net Profit', type: CHART_TYPES.LINE, dataKey: 'Net Income', color: DEFAULT_COLORS[2] },
    { id: 'profitMargin', title: 'Profit Margin', type: CHART_TYPES.PIE, dataKey: 'NP Margin', color: DEFAULT_COLORS[3] },
];

function CustomColorPicker({ color, onChange }) {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleColorChange = (newColor) => {
        onChange(newColor);
        handleClose();
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton onClick={handleClick} style={{ color: color }}>
                <Palette />
            </IconButton>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box p={2}>
                    <Grid container spacing={1}>
                        {DEFAULT_COLORS.map((c) => (
                            <Grid item key={c}>
                                <IconButton
                                    style={{ backgroundColor: c, width: 32, height: 32 }}
                                    onClick={() => handleColorChange(c)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Popover>
        </>
    );
}

function CustomizableDashboard() {
    const theme = useTheme();
    const [user] = useAuthState(auth);
    const [data, setData] = useState([]);
    const [kpis, setKpis] = useState(DEFAULT_KPIS);
    const [editingKpi, setEditingKpi] = useState(null);
    const [newKpi, setNewKpi] = useState({
        title: '',
        type: CHART_TYPES.LINE,
        dataKey: '',
        color: DEFAULT_COLORS[0],
    });

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
        if (newKpi.title && newKpi.type && newKpi.dataKey) {
            const updatedKpis = [...kpis, { ...newKpi, id: `kpi-${Date.now()}` }];
            setKpis(updatedKpis);
            updateKpisInFirestore(updatedKpis);
            setNewKpi({
                title: '',
                type: CHART_TYPES.LINE,
                dataKey: '',
                color: DEFAULT_COLORS[0],
            });
        }
    };

    const editKpi = (kpi) => {
        setEditingKpi(kpi);
    };

    const updateKpi = () => {
        if (editingKpi) {
            const updatedKpis = kpis.map(k => k.id === editingKpi.id ? editingKpi : k);
            setKpis(updatedKpis);
            updateKpisInFirestore(updatedKpis);
            setEditingKpi(null);
        }
    };

    const deleteKpi = (kpiId) => {
        const updatedKpis = kpis.filter(k => k.id !== kpiId);
        setKpis(updatedKpis);
        updateKpisInFirestore(updatedKpis);
    };

    const renderChart = (kpi) => {
        switch (kpi.type) {
            case CHART_TYPES.LINE:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <XAxis dataKey="Month" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey={kpi.dataKey} stroke={kpi.color} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case CHART_TYPES.BAR:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <XAxis dataKey="Month" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey={kpi.dataKey} fill={kpi.color} />
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
                                fill={kpi.color}
                                label
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
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
                            value={newKpi.title}
                            onChange={(e) => setNewKpi({ ...newKpi, title: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            select
                            label="Chart Type"
                            value={newKpi.type}
                            onChange={(e) => setNewKpi({ ...newKpi, type: e.target.value })}
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
                            value={newKpi.dataKey}
                            onChange={(e) => setNewKpi({ ...newKpi, dataKey: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <CustomColorPicker
                            color={newKpi.color}
                            onChange={(color) => setNewKpi({ ...newKpi, color })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                        <Button variant="contained" onClick={addNewKpi} startIcon={<PlusCircle />}>
                            Add
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
                                        <Grid item xs={12} sm={6} md={4} lg={3} ref={provided.innerRef} {...provided.draggableProps}>
                                            <Paper sx={{ p: 2, height: '100%' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                    <Typography variant="h6">{kpi.title}</Typography>
                                                    <Box>
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" onClick={() => editKpi(kpi)}>
                                                                <Edit />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton size="small" onClick={() => deleteKpi(kpi.id)}>
                                                                <Trash2 />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Drag to reorder">
                                                            <IconButton size="small" {...provided.dragHandleProps}>
                                                                <Move />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
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
            {editingKpi && (
                <Paper sx={{ p: 2, mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Edit KPI
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="KPI Title"
                                value={editingKpi.title}
                                onChange={(e) => setEditingKpi({ ...editingKpi, title: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                select
                                label="Chart Type"
                                value={editingKpi.type}
                                onChange={(e) => setEditingKpi({ ...editingKpi, type: e.target.value })}
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
                                value={editingKpi.dataKey}
                                onChange={(e) => setEditingKpi({ ...editingKpi, dataKey: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <CustomColorPicker
                                color={editingKpi.color}
                                onChange={(color) => setEditingKpi({ ...editingKpi, color })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                            <Button variant="contained" onClick={updateKpi}>
                                Update
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
}

export default CustomizableDashboard;
