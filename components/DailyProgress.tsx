"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp, addDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebaseConfig';
import { FaUtensils, FaDrumstickBite, FaBreadSlice } from 'react-icons/fa';
import { GiAvocado } from 'react-icons/gi';
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Drumstick, Cookie, LucideIcon, Cake } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
const CircularProgress: React.FC<CircularProgressProps> = ({ value, size = 120, strokeWidth = 10, icon: Icon }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    className="text-gray-200 dark:text-black"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="text-black dark:text-gray-300"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-1/3 h-1/3" />
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
        if (user) {
          const analysesRef = collection(db, 'users', user.uid, 'analyses');
          const querySnapshot = await getDocs(analysesRef);
          const analyses = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            let imageUrl = data.imageUrl;
            
            // If the imageUrl is a storage path, get the download URL
            if (imageUrl && imageUrl.startsWith('gs://')) {
              const storage = getStorage();
              const imageRef = ref(storage, imageUrl);
              try {
                imageUrl = await getDownloadURL(imageRef);
              } catch (error) {
                console.error('Error getting download URL:', error);
                imageUrl = '/placeholder-image.jpg'; // Use placeholder if download fails
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
        }
      };
    useEffect(() => {
        if (!user) return;

        const userDocRef = doc(db, 'users', user.uid);
        
        const fetchData = async () => {
            try {
                fetchPastAnalyses()
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
                        console.log('hours since last reset :' + hoursDiff)
                        if (hoursDiff >= 24) {
                            const newStreak = data.goalsCompleted ? (data.streak || 0) + 1 : 0;
                            await updateDoc(userDocRef, {
                                total: { calories: 0, fat: 0, carbs: 0, protein: 0 },
                                lastResetTimestamp: serverTimestamp(),
                                goalsCompleted: false,
                                streak: newStreak,
                            });
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
                            
                        
                                
                            // Delete the document from Firestore
                            await deleteDoc(doc.ref);
                                }
                            setTotal({ calories: 0, fat: 0, carbs: 0, protein: 0 });
                            saveTotalToFirestore({ calories: 0, fat: 0, carbs: 0, protein: 0 })
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
        await setDoc(doc(db, 'users', user.uid, 'weights', date), { weight });
        
        await updateDoc(doc(db, 'users', user.uid, 'weights', date), { weight });
        await updateDoc(doc(db, 'users', user.uid, 'metadata', 'lastWeightLog'), { date: new Date() });
        
        setIsWeightDialogOpen(false);
        setNewWeight('');
    };

    
    const NutrientProgress: React.FC<NutrientProgressProps> = ({ title, current, goal, icon }) => {
        const progress = calculateProgress(current, goal);
        const remaining = Math.max(goal - current, 0);

        return (
            <div className="flex items-center space-x-3">
                <CircularProgress value={progress} icon={icon} />
                <div>
                    <h3 className="text-sm font-medium dark:text-white">{title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{current}g / {goal}g</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{remaining}g left</p>
                </div>
            </div>
        );
    };

    return (
        <>
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold dark:text-white">Todays Progress</h2>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Streak: {streak} days</span>
            </div>

            {recommendations && (
                <div className="grid grid-cols-2 gap-4">
                    <NutrientProgress
                        title="Calories"
                        current={total.calories}
                        goal={recommendations.calories}
                        icon={Flame}
                    />
                    <NutrientProgress
                        title="Protein"
                        current={total.protein}
                        goal={recommendations.protein}
                        icon={Drumstick}
                    />
                    <NutrientProgress
                        title="Carbs"
                        current={total.carbs}
                        goal={recommendations.carbs}
                        icon={Cookie}
                    />
                    <NutrientProgress
                        title="Fats"
                        current={total.fat}
                        goal={recommendations.fat}
                        icon={Cake}
                    />
                </div>
            )}
        </div>
            
        </>
    );
};


export default DailyProgress;