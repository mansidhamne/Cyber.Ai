'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Upload, ChevronLeft, ChevronRight, Maximize2, Minimize2, Shield, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { UserButton } from '@clerk/nextjs'

const BizBot = ({ onComplete }) => {
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
            setConversation(prev => [...prev, { type: 'bot', content: "Great! We've completed all the questions. I'll now generate your assessment results." }])
            onComplete({
              documentSummary: [
                "Infrastructure consists of 3 web servers and 2 database servers",
                "Web servers are running Apache 2.4 on Ubuntu 20.04",
                "Database servers are using MySQL 8.0",
                "Firewall is configured but some ports are open for development purposes"
              ],
              vulnerabilityReport: [
                { title: "Outdated Apache Version", description: "Apache 2.4 has known vulnerabilities. Upgrade to the latest version." },
                { title: "Open Ports", description: "Several unnecessary ports are open, increasing attack surface." },
                { title: "Weak Password Policy", description: "Current password policy does not meet industry standards." }
              ],
              riskScore: 65
            })
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
    <div className="h-full flex flex-col">
      <div className="flex-grow overflow-auto p-4 space-y-4">
        {conversation.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] p-3 rounded-lg ${
              message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-blue-800 shadow-md'
            }`}>
              {message.content}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="p-4 bg-white bg-opacity-50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
            placeholder={userName ? "Type your answer here..." : "Enter your name"}
            className="flex-grow bg-white bg-opacity-75"
          />
          <Button onClick={handleAnswer} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white">
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
        {questions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-blue-800 mb-2">Progress</p>
            <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2 bg-blue-200" />
          </div>
        )}
      </div>
    </div>
  )
}

const HomePage = () => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true)
  const [isNewsFeedOpen, setIsNewsFeedOpen] = useState(true)
  const [isChatbotMaximized, setIsChatbotMaximized] = useState(false)
  const [newsItems, setNewsItems] = useState([])
  const router = useRouter()

  useEffect(() => {
    const fetchedNews = [
      { id: 1, title: "Major data breach at tech giant", date: "2023-06-01" },
      { id: 2, title: "New ransomware strain targets healthcare", date: "2023-06-02" },
      { id: 3, title: "Critical vulnerability found in popular software", date: "2023-06-03" },
    ]
    setNewsItems(fetchedNews)
  }, [])

  const handleAssessmentComplete = async (results) => {
    router.push({
      pathname: '/assessment-results',
      query: { results: JSON.stringify(results) },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white">
      {/* Navbar */}
      <nav className="bg-white bg-opacity-70 backdrop-blur-lg shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="font-extrabold text-blue-700 text-xl">CyberGuard AI</span>
          </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-6 h-6 text-blue-600 cursor-pointer" />
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-8 p-6 flex space-x-6">
        {/* Left Column: Onboarding and News Feed */}
        <motion.div
          className="w-1/3 space-y-6"
          initial={{ width: "33.333%" }}
          animate={{ width: isOnboardingOpen || isNewsFeedOpen ? "33.333%" : "0%" }}
          transition={{ duration: 0.3 }}
        >
          {/* Onboarding Section */}
          <AnimatePresence>
            {isOnboardingOpen && (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-white bg-opacity-70 backdrop-blur-lg rounded-lg shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-blue-800">Assessment Flow</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOnboardingOpen(!isOnboardingOpen)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChevronLeft size={20} />
                  </Button>
                </div>
                <ol className="list-decimal list-inside space-y-4 text-blue-800">
                  <li className="flex items-center">
                    <span className="mr-2">📁</span>
                    Upload infrastructure documents
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">💬</span>
                    Answer questions about your infrastructure
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">📊</span>
                    Receive risk score and vulnerabilities report
                  </li>
                </ol>
              </motion.div>
            )}
          </AnimatePresence>

          {/* News Feed Section */}
          <AnimatePresence>
            {isNewsFeedOpen && (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-white bg-opacity-70 backdrop-blur-lg rounded-lg shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-blue-800">Incident Feed</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNewsFeedOpen(!isNewsFeedOpen)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChevronLeft size={20} />
                  </Button>
                </div>
                <ul className="space-y-4">
                  {newsItems.map((item) => (
                    <li key={item.id} className="border-b border-blue-200 pb-4">
                      <p className="font-semibold text-blue-800">{item.title}</p>
                      <p className="text-sm text-blue-600">{item.date}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Column: Chatbot */}
        <motion.div
          className="flex-grow"
          animate={{ width: isChatbotMaximized ? "100%" : "66.666%" }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white bg-opacity-70 backdrop-blur-lg rounded-lg shadow-lg h-[calc(100vh-8rem)] flex flex-col">
            <div className="p-4 border-b border-blue-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-800">Cyber Bot</h2>
              <div className="flex space-x-2">
                {!isOnboardingOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOnboardingOpen(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChevronRight size={20} />
                  </Button>
                )}
                {!isNewsFeedOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNewsFeedOpen(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChevronRight size={20} />
                  </Button>
                
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatbotMaximized(!isChatbotMaximized)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {isChatbotMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </Button>
              </div>
            </div>
            <div className="flex-grow overflow-hidden">
              <BizBot onComplete={handleAssessmentComplete} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default HomePage