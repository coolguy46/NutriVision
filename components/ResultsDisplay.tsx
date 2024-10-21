"use client"

import React, { useState, useEffect } from 'react';
import { FoodData } from '@/components/types';
import { Button } from "@/components/ui/button";
import { Flame, Cookie, Drumstick } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GiAvocado } from 'react-icons/gi';

interface ResultsDisplayProps {
  foodData: FoodData & { initialQuantity?: number; id?: string };
  setAnalysisResult: (result: FoodData & { quantity: number; id?: string }) => void;
  onClose: () => void;
}

export default function ResultsDisplay({ foodData, setAnalysisResult, onClose }: ResultsDisplayProps) {
  const [editableData, setEditableData] = useState<FoodData>(foodData);
  const [quantity, setQuantity] = useState(foodData.initialQuantity || 1);
  const [isFixing, setIsFixing] = useState(false);
  const [baseNutrition, setBaseNutrition] = useState({
    calories: foodData.calories,
    carbs: foodData.carbs,
    protein: foodData.protein,
    fat: foodData.fat,
  });

  useEffect(() => {
    setEditableData(foodData);
    setQuantity(foodData.initialQuantity || 1);
    setBaseNutrition({
      calories: Math.round(foodData.calories / (foodData.initialQuantity || 1)),
      carbs: Math.round(foodData.carbs / (foodData.initialQuantity || 1)),
      protein: Math.round(foodData.protein / (foodData.initialQuantity || 1)),
      fat: Math.round(foodData.fat / (foodData.initialQuantity || 1)),
    });
  }, [foodData]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
    updateNutrition(newQuantity);
  };

  const updateNutrition = (newQuantity: number) => {
    const updatedData = {
      ...editableData,
      calories: Math.round(baseNutrition.calories * newQuantity),
      carbs: Math.round(baseNutrition.carbs * newQuantity),
      protein: Math.round(baseNutrition.protein * newQuantity),
      fat: Math.round(baseNutrition.fat * newQuantity),
    };
    setEditableData(updatedData);
  };

  const handleFixResults = () => {
    setIsFixing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableData(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value)
    }));
  };

  const handleFixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update the base nutrition when fixing results
    setBaseNutrition({
      calories: Math.round(editableData.calories / quantity),
      carbs: Math.round(editableData.carbs / quantity),
      protein: Math.round(editableData.protein / quantity),
      fat: Math.round(editableData.fat / quantity),
    });
    setAnalysisResult({ ...editableData, quantity });
    setIsFixing(false);
  };



  const handleDone = () => {
    const result = { ...editableData, quantity, id: foodData.id };
    setAnalysisResult(result);
    onClose();
  };

  
  return (
    <div className="space-y-6 dark:text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold dark:text-white">{editableData.name}:</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="w-8 h-8 dark:bg-gray-700 dark:text-white" onClick={() => handleQuantityChange(-1)}>-</Button>
          <span className="dark:text-white">{quantity}</span>
          <Button variant="outline" size="icon" className="w-8 h-8 dark:bg-gray-700 dark:text-white" onClick={() => handleQuantityChange(1)}>+</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-sm font-medium dark:text-gray-300">Calories</p>
            <p className="text-lg font-bold dark:text-white">{editableData.calories}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Cookie className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm font-medium dark:text-gray-300">Carbs</p>
            <p className="text-lg font-bold dark:text-white">{editableData.carbs}g</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Drumstick className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium dark:text-gray-300">Protein</p>
            <p className="text-lg font-bold dark:text-white">{editableData.protein}g</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <GiAvocado className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm font-medium dark:text-gray-300">Fats</p>
            <p className="text-lg font-bold dark:text-white">{editableData.fat}g</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <Button variant="outline" className="flex-1 dark:bg-gray-700 dark:text-white" onClick={handleFixResults}>
          Fix Results
        </Button>
        <Button className="flex-1 dark:bg-blue-600 dark:text-white" onClick={handleDone}>Done</Button>
      </div>

      <Dialog open={isFixing} onOpenChange={setIsFixing}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Fix Results</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFixSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right dark:text-white">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={editableData.name}
                  onChange={handleInputChange}
                  className="col-span-3 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="calories" className="text-right dark:text-white">
                  Calories
                </Label>
                <Input
                  id="calories"
                  name="calories"
                  type="number"
                  value={editableData.calories}
                  onChange={handleInputChange}
                  className="col-span-3 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="carbs" className="text-right dark:text-white">
                  Carbs (g)
                </Label>
                <Input
                  id="carbs"
                  name="carbs"
                  type="number"
                  value={editableData.carbs}
                  onChange={handleInputChange}
                  className="col-span-3 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="protein" className="text-right">
                  Protein (g)
                </Label>
                <Input
                  id="protein"
                  name="protein"
                  type="number"
                  value={editableData.protein}
                  onChange={handleInputChange}
                  className="col-span-3 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fat" className="text-right">
                  Fat (g)
                </Label>
                <Input
                  id="fat"
                  name="fat"
                  type="number"
                  value={editableData.fat}
                  onChange={handleInputChange}
                  className="col-span-3 dark:bg-gray-700 dark:text white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="dark:bg-blue-600 dark:text-white">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}