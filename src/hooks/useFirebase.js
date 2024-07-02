import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

export const useFirebase = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getDocument = async (collectionName, documentId) => {
        setLoading(true);
        try {
            const docRef = doc(db, collectionName, documentId);
            const docSnap = await getDoc(docRef);
            setLoading(false);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return null;
        }
    };

    const setDocument = async (collectionName, documentId, data) => {
        setLoading(true);
        try {
            await setDoc(doc(db, collectionName, documentId), data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const updateDocument = async (collectionName, documentId, data) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, collectionName, documentId), data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const deleteDocument = async (collectionName, documentId) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, collectionName, documentId));
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const queryDocuments = async (collectionName, conditions) => {
        setLoading(true);
        try {
            const q = query(collection(db, collectionName), ...conditions);
            const querySnapshot = await getDocs(q);
            setLoading(false);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    return {
        loading,
        error,
        getDocument,
        setDocument,
        updateDocument,
        deleteDocument,
        queryDocuments
    };
};
