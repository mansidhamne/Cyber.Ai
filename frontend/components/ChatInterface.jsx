'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Send, Upload } from 'lucide-react'
import { Progress } from "@/components/ui/progress"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const BizBot = () => {
  const [file, setFile] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [conversation, setConversation] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/questions')
      setQuestions(response.data.questions)
      setConversation([
        { type: 'bot', content: 'Welcome to BizBot!' },
        { type: 'bot', content: 'I am BizBot 😎' },
        { type: 'bot', content: 'May I know your name?' },
      ])
    } catch (error) {
      console.error('Error fetching questions:', error)
      setConversation([{ type: 'bot', content: 'Sorry, I encountered an error while fetching questions. Please try again later.' }])
    }
    setIsLoading(false)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    setFile(file)

    const formData = new FormData()
    formData.append('file', file)

    setIsLoading(true)
    try {
      await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setConversation(prev => [...prev, { type: 'bot', content: `Great! I've successfully uploaded and parsed the file "${file.name}". Let's continue with our assessment.` }])
    } catch (error) {
      console.error('Error uploading file:', error)
      setConversation(prev => [...prev, { type: 'bot', content: 'I apologize, but there was an error uploading the file. Could you please try again?' }])
    }
    setIsLoading(false)
  }

  const handleAnswer = async () => {
    if (!answer.trim()) return

    if (!userName) {
      setUserName(answer)
      setConversation(prev => [
        ...prev,
        { type: 'user', content: answer },
        { type: 'bot', content: `Nice to meet you, ${answer}! Let's start our assessment. ${questions[0].question}` }
      ])
    } else {
      setConversation(prev => [...prev, { type: 'user', content: answer }])
      setIsLoading(true)

      try {
        const response = await axios.post('http://localhost:8000/answer', {
          question: questions[currentQuestionIndex].question,
          answer: answer
        })

        if (response.data.follow_up_question) {
          setConversation(prev => [...prev, { type: 'bot', content: response.data.follow_up_question }])
        } else {
          setCurrentQuestionIndex(prev => prev + 1)
          if (currentQuestionIndex + 1 < questions.length) {
            setConversation(prev => [...prev, { type: 'bot', content: questions[currentQuestionIndex + 1].question }])
          } else {
            setConversation(prev => [...prev, { type: 'bot', content: "Great! We've completed all the questions. Would you like to save the results?" }])
          }
        }
      } catch (error) {
        console.error('Error processing answer:', error)
        setConversation(prev => [...prev, { type: 'bot', content: 'I apologize, but there was an error processing your answer. Could you please try again?' }])
      }

      setIsLoading(false)
    }

    setAnswer('')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-500 text-white py-4 px-6 flex items-center">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
          <span className="text-blue-500 text-2xl">🤖</span>
        </div>
        <h1 className="text-2xl font-bold">BizBot</h1>
      </div>
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-gray-50 border-b p-4">
            <h2 className="text-xl font-semibold">BizBot</h2>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 mb-4">
              {conversation.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] p-3 rounded-lg ${
                    message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}>
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
                placeholder={userName ? "Type your answer here..." : "Enter your name"}
                className="flex-grow"
              />
              <Button onClick={handleAnswer} disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white">
                <Send size={20} />
              </Button>
            </div>
            {!file && (
              <div className="mt-4 flex justify-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200">
                    <Upload size={20} />
                    <span>Upload PDF</span>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </CardContent>
        </Card>
        {questions.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-2">Progress</p>
              <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2 bg-gray-700" />
            </div>
          )}
      </div>
    </div>
  )
}

export default BizBot