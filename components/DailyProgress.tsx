"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Drumstick, Cookie, LucideIcon, Cake, Trophy, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteObject, getDownloadURL, getStorage, ref } from 'firebase/storage';
import { FoodData } from '@/components/types';

interface NutrientProgressProps {
    title: string;
    current: number;
    goal: number;
    icon: LucideIcon;
    color: string;
}

interface Recommendations {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface CircularProgressProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    icon: LucideIcon;
    color: string;
}

interface ExtendedFoodData extends FoodData {
    id?: string;
    imageUrl?: string;
    timestamp?: number;
    imageFile?: File;
}

interface PastAnalysis extends ExtendedFoodData {
    id: string;
    imageUrl: string;
    timestamp: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, size = 120, strokeWidth = 12, icon: Icon, color }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90">
                <circle
                    className="opacity-20"
                    strokeWidth={strokeWidth}
                    stroke={color}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke={color}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-1/3 h-1/3" style={{ color }} />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs font-medium" style={{ color }}>
                {Math.round(value)}%
            </div>
        </div>
    );
};

const DailyProgress: React.FC = () => {
    const { user, saveTotalToFirestore } = useAuth();
    const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
    const [total, setTotal] = useState({
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
    });
    const [goalsCompleted, setGoalsCompleted] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [pastAnalyses, setPastAnalyses] = useState<PastAnalysis[]>([]);

    const fetchPastAnalyses = async () => {
        if (!user) return;
        
        const analysesRef = collection(db, 'users', user.uid, 'analyses');
        const querySnapshot = await getDocs(analysesRef);
        const analyses = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            let imageUrl = data.imageUrl;
            
            if (imageUrl && imageUrl.startsWith('gs://')) {
                const storage = getStorage();
                const imageRef = ref(storage, imageUrl);
                try {
                    imageUrl = await getDownloadURL(imageRef);
                } catch (error) {
                    console.error('Error getting download URL:', error);
                    imageUrl = '/placeholder-image.jpg';
                }
            }
            
            return {
                id: doc.id,
                ...data,
                imageUrl: imageUrl || '/placeholder-image.jpg',
                quantity: data.quantity || 1
            } as PastAnalysis;
        }));
        setPastAnalyses(analyses.sort((a, b) => b.timestamp - a.timestamp));
    };

    useEffect(() => {
        if (!user) return;

        const userDocRef = doc(db, 'users', user.uid);
        
        const fetchData = async () => {
            try {
                await fetchPastAnalyses();
                const docSnapshot = await getDoc(userDocRef);
                const storage = getStorage();
                const analysesRef = collection(db, 'users', user.uid, 'analyses');
                const querySnapshot = await getDocs(analysesRef);

                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    if (data) {
                        const lastResetTimestamp = data.lastResetTimestamp?.toDate() || new Date(0);
                        const now = new Date();
                        const hoursDiff = (now.getTime() - lastResetTimestamp.getTime()) / (1000 * 3600);
                        
                        if (hoursDiff >= 24) {
                            // First update the total in state and Firestore
                            const newTotal = { calories: 0, fat: 0, carbs: 0, protein: 0 };
                            setTotal(newTotal);
                            await saveTotalToFirestore(newTotal);
                            
                            const newStreak = data.goalsCompleted ? (data.streak || 0) + 1 : 0;
                            
                            // Then update other fields
                            await updateDoc(userDocRef, {
                                lastResetTimestamp: serverTimestamp(),
                                goalsCompleted: false,
                                streak: newStreak,
                            });

                            // Delete analyses and their images
                            for (const doc of querySnapshot.docs) {
                                const analysis = doc.data() as PastAnalysis;
                                if (analysis.imageUrl) {
                                    const imageRef = ref(storage, analysis.imageUrl);
                                    try {
                                        await deleteObject(imageRef);
                                    } catch (error) {
                                        console.error('Error deleting image:', error);
                                    }
                                }
                                await deleteDoc(doc.ref);
                            }
                            
                            setGoalsCompleted(false);
                            setStreak(newStreak);
                        } else {
                            setTotal(data.total || { calories: 0, fat: 0, carbs: 0, protein: 0 });
                            setGoalsCompleted(data.goalsCompleted || false);
                            setStreak(data.streak || 0);
                        }
                    }
                }

                const recommendationsDocRef = doc(db, 'users', user.uid, 'recommendations', 'daily');
                const recommendationsSnapshot = await getDoc(recommendationsDocRef);

                if (recommendationsSnapshot.exists()) {
                    setRecommendations(recommendationsSnapshot.data() as Recommendations);
                }

                const lastWeightRef = doc(db, 'users', user.uid, 'metadata', 'lastWeightLog');
                const lastWeightDoc = await getDoc(lastWeightRef);
                const lastWeightDate = lastWeightDoc.exists() ? lastWeightDoc.data().date.toDate() : new Date(0);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                
                if (lastWeightDate < oneWeekAgo) {
                    setIsWeightDialogOpen(true);
                }
            } catch (error) {
                console.error('Error fetching data from Firestore:', error);
            }
        };

        fetchData();

        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setTotal(data.total || { calories: 0, fat: 0, carbs: 0, protein: 0 });
                setGoalsCompleted(data.goalsCompleted || false);
                setStreak(data.streak || 0);
            }
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (recommendations && user) {
            const allGoalsMet = Object.keys(recommendations).every(
                (key) => total[key as keyof typeof total] >= recommendations[key as keyof Recommendations]
            );

            if (allGoalsMet && !goalsCompleted) {
                const userDocRef = doc(db, 'users', user.uid);
                updateDoc(userDocRef, { goalsCompleted: true });
            }
        }
    }, [total, recommendations, goalsCompleted, user]);

    const calculateProgress = (current: number, goal: number) => {
        return Math.min((current / goal) * 100, 100);
    };

    const calculateRemaining = (current: number, goal: number) => {
        return Math.max(goal - current, 0);
    };

    const handleWeightSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newWeight) return;

        const weight = parseFloat(newWeight);
        const date = new Date().toISOString().split('T')[0];
        
        await updateDoc(doc(db, 'users', user.uid, 'weights', date), { weight });
        await updateDoc(doc(db, 'users', user.uid, 'metadata', 'lastWeightLog'), { date: new Date() });
        
        setIsWeightDialogOpen(false);
        setNewWeight('');
    };

    const NutrientProgress: React.FC<NutrientProgressProps> = ({ title, current, goal, icon, color }) => {
        const progress = calculateProgress(current, goal);
        const remaining = calculateRemaining(current, goal);

        return (
            <Card className="p-4 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-0">
                    <div className="flex items-center space-x-4">
                        <CircularProgress value={progress} icon={icon} color={color} />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1 dark:text-white">{title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {current.toFixed(1)}g of {goal}g
                            </p>
                            <p className="text-xs text-gray-500">
                                {remaining.toFixed(1)}g remaining
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <Card className="w-full p-6 shadow-xl">
            <CardHeader className="px-0 pt-0">
                <div className="flex justify-between items-center mb-6">
                    <CardTitle className="text-2xl font-bold dark:text-white">
                        Daily Progress
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            {streak} Day Streak
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-0 pb-0">
                {recommendations ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NutrientProgress
                            title="Calories"
                            current={total.calories}
                            goal={recommendations.calories}
                            icon={Flame}
                            color="#FF5733"
                        />
                        <NutrientProgress
                            title="Protein"
                            current={total.protein}
                            goal={recommendations.protein}
                            icon={Drumstick}
                            color="#33A1FD"
                        />
                        <NutrientProgress
                            title="Carbs"
                            current={total.carbs}
                            goal={recommendations.carbs}
                            icon={Cookie}
                            color="#33FF57"
                        />
                        <NutrientProgress
                            title="Fats"
                            current={total.fat}
                            goal={recommendations.fat}
                            icon={Cake}
                            color="#FDA433"
                        />
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                )}
            </CardContent>

    
        </Card>
    );
};

export default DailyProgress;
