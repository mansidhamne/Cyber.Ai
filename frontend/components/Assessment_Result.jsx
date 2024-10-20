'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const AssessmentResultsPage = ({ documentSummary, vulnerabilityReport, riskScore }) => {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Button>

        <h1 className="text-3xl font-bold text-blue-800 mb-6">Assessment Results</h1>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="summary">Document Summary</TabsTrigger>
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="risk">Risk Score</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader className="text-xl font-semibold text-blue-800">Document Summary</CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  {documentSummary?.map((item, index) => (
                    <li key={index} className="text-blue-700">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities">
            <Card>
              <CardHeader className="text-xl font-semibold text-blue-800">Vulnerability Report</CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {vulnerabilityReport?.map((vuln, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="text-yellow-500 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-blue-700">{vuln.title}</h3>
                        <p className="text-blue-600">{vuln.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk">
            <Card>
              <CardHeader className="text-xl font-semibold text-blue-800">Risk Score</CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold mb-4 text-blue-700">{riskScore}/100</div>
                  <Progress value={riskScore} className="h-4 bg-blue-200" />
                  <p className="mt-4 text-blue-600">
                    Your current risk score indicates {riskScore < 50 ? 'a high' : 'a moderate'} level of cybersecurity risk.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

export default AssessmentResultsPage