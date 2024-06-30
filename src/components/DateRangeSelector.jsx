import React from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

function DateRangeSelector({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  const handleStartDateChange = (newDate) => {
    if (endDate && dayjs(newDate).isAfter(endDate)) {
      onEndDateChange(null);
    }
    onStartDateChange(newDate);
  };

  const handleEndDateChange = (newDate) => {
    if (startDate && dayjs(newDate).isBefore(startDate)) {
      return;
    }
    onEndDateChange(newDate);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box display="flex" flexDirection="column" mb={2}>
        <Typography variant="h6" gutterBottom>
          Filter Data by Date Range
        </Typography>
        <Box display="flex" justifyContent="space-between">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            renderInput={(params) => <TextField {...params} />}
            maxDate={endDate || undefined}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            renderInput={(params) => <TextField {...params} />}
            minDate={startDate || undefined}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
}

export default DateRangeSelector;