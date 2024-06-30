import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, TextField, Button, CircularProgress, Box, Snackbar } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function UserProfile() {
  const [user, loading] = useAuthState(auth);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [updating, setUpdating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCompany(userData.company || '');
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      await updateProfile(user, { displayName });
      await setDoc(doc(db, 'users', user.uid), { company }, { merge: true });
      setSnackbarMessage('Profile updated successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbarMessage('Failed to update profile');
      setSnackbarOpen(true);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={300}>
        User Profile
      </Typography>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleUpdateProfile}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={email}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Profile'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}

export default UserProfile;