export interface FoodData {
    name: string
    calories: number
    quantity: number
    protein: number
    carbs: number
    fat: number
    imageFile?: File; // Optional property to store the image file
    initialQuantity?: number;
  }