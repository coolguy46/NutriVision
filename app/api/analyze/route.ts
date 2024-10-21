import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export async function POST(request: Request) {
  const formData = await request.formData()
  const image = formData.get('image') as File

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  try {
    const imageBuffer = await image.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    const parts = [
      {
        inlineData: {
          mimeType: image.type,
          data: imageBase64
        }
      }
    ]

    // Update the model name to gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = 'Analyze this food image and provide the following information: name of the dish, calories, amount, and macronutrients (protein, carbs, fat in grams). Format the response as JSON. Make sure it follows the following food data format: interface FoodData { name: string calories: number quantity: number protein: number carbs: number fat: number }'

    const result = await model.generateContent([prompt, ...parts])
    const response = await result.response
    let text = await response.text()

    console.log('Raw Gemini response:', text)

    // Strip out Markdown formatting if present
    text = text.replace(/```json\n?/, '').replace(/\n?```/, '')

    let foodData
    try {
      foodData = JSON.parse(text)
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
      return NextResponse.json({ error: 'Failed to parse food data', rawResponse: text }, { status: 500 })
    }

    return NextResponse.json(foodData)
  } catch (error) {
    console.error('Error analyzing image:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to analyze image', message: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
  }
}
