'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageSquare, Key, Settings, Save, Plus } from 'lucide-react'

export default function ChatbotConfigPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chatbot Configuration</h1>
            <p className="text-muted-foreground">
              Configure your AI chatbot settings and message templates
            </p>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <CardTitle>API Configuration</CardTitle>
              </div>
              <CardDescription>Configure your chatbot API connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" type="password" placeholder="sk-..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endpoint">API Endpoint</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://api.example.com/v1"
                    defaultValue="https://api.openai.com/v1"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" placeholder="gpt-4" defaultValue="gpt-3.5-turbo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue="0.7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input id="maxTokens" type="number" min="1" max="4096" defaultValue="1024" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Enable Chatbot</p>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to interact with the AI chatbot
                  </p>
                </div>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>System Prompt</CardTitle>
              </div>
              <CardDescription>
                Define the chatbot's personality and behavior guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <textarea
                  id="systemPrompt"
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="You are a helpful customer service assistant for BizNavigate, an inventory and CRM management platform. Your role is to assist users with their questions about products, orders, and account management. Be professional, friendly, and concise in your responses."
                />
              </div>
            </CardContent>
          </Card>

          {/* Message Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <CardTitle>Message Templates</CardTitle>
              </div>
              <CardDescription>
                Predefined messages for common customer interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <textarea
                  id="welcomeMessage"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="Hello! Welcome to BizNavigate. How can I help you today?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderStatusTemplate">Order Status Inquiry Template</Label>
                <textarea
                  id="orderStatusTemplate"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="I can help you check your order status. Please provide your order number (e.g., ORD-2024-001)."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productInquiryTemplate">Product Inquiry Template</Label>
                <textarea
                  id="productInquiryTemplate"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="I'd be happy to help you find the right product. What are you looking for?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Fallback Message</Label>
                <textarea
                  id="fallbackMessage"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="I'm not sure I understand. Could you please rephrase your question, or would you like to speak with a human agent?"
                />
              </div>

              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Fine-tune chatbot behavior and capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Enable Context Memory</p>
                  <p className="text-sm text-muted-foreground">
                    Allow chatbot to remember conversation context
                  </p>
                </div>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Enable Product Recommendations</p>
                  <p className="text-sm text-muted-foreground">
                    Allow chatbot to suggest products based on inventory
                  </p>
                </div>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Escalate to Human Agent</p>
                  <p className="text-sm text-muted-foreground">
                    Transfer complex queries to human support
                  </p>
                </div>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseDelay">Response Delay (seconds)</Label>
                <Input
                  id="responseDelay"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  defaultValue="1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
