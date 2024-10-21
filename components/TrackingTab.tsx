"use client"

import React from 'react';

interface TrackingTabProps {
  totalCalories: number;
  totalFat: number;
  totalCarbs: number;
  totalProtein: number;
  addToTotal: () => void;
}

export const TrackingTab: React.FC<TrackingTabProps> = ({ totalCalories, totalFat, totalCarbs, totalProtein, addToTotal }) => {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Nutritional Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex justify-between p-4 bg-gray-100 rounded-lg shadow-inner">
          <span className="font-semibold text-gray-700">Total Calories:</span>
          <span className="text-gray-600">{totalCalories} kcal</span>
        </div>
        <div className="flex justify-between p-4 bg-gray-100 rounded-lg shadow-inner">
          <span className="font-semibold text-gray-700">Total Fat:</span>
          <span className="text-gray-600">{totalFat} g</span>
        </div>
        <div className="flex justify-between p-4 bg-gray-100 rounded-lg shadow-inner">
          <span className="font-semibold text-gray-700">Total Carbs:</span>
          <span className="text-gray-600">{totalCarbs} g</span>
        </div>
        <div className="flex justify-between p-4 bg-gray-100 rounded-lg shadow-inner">
          <span className="font-semibold text-gray-700">Total Protein:</span>
          <span className="text-gray-600">{totalProtein} g</span>
        </div>
      </div>
    </div>
  );
};
