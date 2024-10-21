"use client"

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { FoodData } from '@/components/types'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface UploadFormProps {
  setAnalysisResult: (result: FoodData, file: File) => void
  buttonColor: string
}

export default function UploadForm({ setAnalysisResult, buttonColor }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const analyzeImage = async (file: File) => {
    setLoading(true)
    setError(null)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (response.ok) {
        console.log('Analysis result:', data)
        setAnalysisResult(data, file)
      } else {
        setError(data.error || 'An error occurred')
        console.error('Error:', data.error)
        if (data.rawResponse) {
          console.log('Raw Gemini response:', data.rawResponse)
        }
      }
    } catch (error) {
      setError('Error uploading image')
      console.error('Error uploading image:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      analyzeImage(selectedFile) // Automatically analyze the image
    }
  }

  const openCamera = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <Card className="w-full max-w-sm mx-auto mb-16">
        <CardHeader>
          <CardTitle className="text-center">Upload Food Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground text-center">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground text-center">PNG, JPG or GIF</p>
              </div>
              <Input
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
                ref={fileInputRef}
              />
            </label>
          </div>
          {file && (
            <div className="flex items-center justify-center bg-secondary rounded-md p-2 mt-4">
              <Upload className="w-4 h-4 mr-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground truncate">{file.name}</p>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading && (
            <Progress value={uploadProgress} className="mt-4" />
          )}
        </CardContent>
      </Card>

      <button
        onClick={openCamera}
        className={`fixed bottom-4 right-4 p-4 rounded-full shadow-lg ${buttonColor}`}
      >
        <Upload className="w-6 h-6 text-white" />
      </button>
    </>
  )
}
