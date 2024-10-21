"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import '@/app/globals.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Define an interface for the weight data
interface WeightData {
  date: string;
  weight: number;
}

const WeightAnalytics = () => {
  const { user } = useAuth();
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [goalAchievement, setGoalAchievement] = useState({ achieved: 0, notAchieved: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchWeightData = async () => {
      const weightsRef = collection(db, 'users', user.uid, 'weights');
      const q = query(weightsRef, orderBy('date', 'desc'), limit(7));
      const querySnapshot = await getDocs(q);
      const data: WeightData[] = querySnapshot.docs.map(doc => ({
        date: doc.id,
        weight: doc.data().weight
      }));
      setWeightData(data.reverse());
    };

    const fetchGoalAchievement = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnapshot = await getDoc(userDocRef);
      
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const achieved = userData.goalsCompleted ? 1 : 0;
        const notAchieved = userData.goalsCompleted ? 0 : 1;
        setGoalAchievement({ achieved, notAchieved });
      }
    };

    fetchWeightData();
    fetchGoalAchievement();
  }, [user]);

  const barChartData = {
    labels: weightData.map(item => item.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightData.map(item => item.weight),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const pieChartData = {
    labels: ['Goals Achieved', 'Goals Not Achieved'],
    datasets: [
      {
        data: [goalAchievement.achieved, goalAchievement.notAchieved],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Weight Progress</h2>
        </CardHeader>
        <CardContent>
          <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Today's Goal Achievement</h2>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeightAnalytics;