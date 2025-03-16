"use client"

import { useState, useRef, useEffect } from "react"
import { FileJson, Database, Code2, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CodeBlock } from "./code-block"
import { parseSanitySchema, generateGroqQueries, formatQueryCode } from "@/lib/sanity-utils"

export function SanityGroqGenerator() {
  const [schemaInput, setSchemaInput] = useState("")
  const [format, setFormat] = useState("js")
  const [generatedQueries, setGeneratedQueries] = useState<{
    singleDocument: string
    multipleDocuments: string
    slugBased: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queriesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (generatedQueries && queriesRef.current) {
      queriesRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [generatedQueries])

  const handleGenerate = () => {
    if (!schemaInput.trim()) {
      setError("Please paste your Sanity schema first")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const parsedSchema = parseSanitySchema(schemaInput)

      if (parsedSchema.typeName === "unknown" || parsedSchema.fields.length === 0) {
        setError("Could not parse schema correctly. Please check your input.")
        setIsLoading(false)
        return
      }

      const queries = generateGroqQueries(parsedSchema)

      const formattedQueries = {
        singleDocument: formatQueryCode(queries.singleDocumentQuery, format, parsedSchema.typeName, "Single"),
        multipleDocuments: formatQueryCode(queries.multipleDocumentsQuery, format, parsedSchema.typeName, "List"),
        slugBased: queries.slugQuery
          ? formatQueryCode(queries.slugQuery, format, parsedSchema.typeName, "BySlug")
          : null,
      }

      setGeneratedQueries(formattedQueries)
    } catch (err) {
      setError("An error occurred while generating queries. Please check your schema format.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAll = () => {
    setSchemaInput("")
    setGeneratedQueries(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-6 md:p-8">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#60a5fa] inline-block mb-3">
            Sanity GROQ Query Generator
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Transform your Sanity schema into optimized GROQ queries with just one click
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-gradient-to-b from-[#1e293b]/90 to-[#0f172a]/90 backdrop-blur-sm rounded-xl overflow-hidden border border-[#334155]/50">
          <CardHeader className="bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b] border-b border-[#334155]/50 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#3b82f6]/20 p-2 rounded-lg border border-[#3b82f6]/30">
                <Database className="h-6 w-6 text-[#60a5fa]" />
              </div>
              <CardTitle className="text-white text-xl font-bold">Schema to GROQ</CardTitle>
            </div>
            <CardDescription className="text-slate-400 mt-2">
              Paste your Sanity schema to automatically generate optimized GROQ queries
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="schema-input" className="text-base font-medium text-white flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#60a5fa]" />
                  Sanity Schema
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 text-xs text-slate-400 hover:text-white hover:bg-[#334155]/50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                <Textarea
                  id="schema-input"
                  className="font-mono h-64 resize-none relative bg-[#0f172a] border-[#334155] text-slate-300 rounded-lg focus-visible:ring-[#60a5fa] focus-visible:ring-offset-0 focus-visible:ring-offset-transparent"
                  value={schemaInput}
                  onChange={(e) => setSchemaInput(e.target.value)}
                  placeholder="// Paste your Sanity schema definition here, for example:
export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
    // ... more fields
  ],
})"
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-800/50">{error}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium text-white flex items-center gap-2">
                <FileJson className="h-4 w-4 text-[#60a5fa]" />
                Output Format
              </Label>
              <RadioGroup defaultValue="js" value={format} onValueChange={setFormat} className="flex flex-wrap gap-4 text-white">
                <div className="flex items-center space-x-2 bg-[#1e293b]/70 px-4 py-2 rounded-lg border border-[#334155]/70 hover:border-[#60a5fa]/50 transition-colors">
                  <RadioGroupItem value="js" id="js" className="text-[#60a5fa]" />
                  <Label htmlFor="js" className="cursor-pointer">
                    JavaScript
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-[#1e293b]/70 px-4 py-2 rounded-lg border border-[#334155]/70 hover:border-[#60a5fa]/50 transition-colors">
                  <RadioGroupItem value="ts" id="ts" className="text-[#60a5fa]" />
                  <Label htmlFor="ts" className="cursor-pointer">
                    TypeScript
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-[#1e293b]/70 px-4 py-2 rounded-lg border border-[#334155]/70 hover:border-[#60a5fa]/50 transition-colors">
                  <RadioGroupItem value="groq" id="groq" className="text-[#60a5fa]" />
                  <Label htmlFor="groq" className="cursor-pointer">
                    GROQ Only
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-[#334155]/50 p-6">
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] hover:from-[#60a5fa] hover:to-[#a78bfa] text-white border-none shadow-lg shadow-[#3b82f6]/30 gap-2 transition-all duration-300 hover:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Queries
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {generatedQueries && (
          <Card ref={queriesRef} className="mt-10 border-none shadow-2xl bg-gradient-to-b from-[#1e293b]/90 to-[#0f172a]/90 backdrop-blur-sm rounded-xl overflow-hidden border border-[#334155]/50">
            <CardHeader className="bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b] border-b border-[#334155]/50 p-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#8b5cf6]/20 p-2 rounded-lg border border-[#8b5cf6]/30">
                  <Code2 className="h-6 w-6 text-[#a78bfa]" />
                </div>
                <CardTitle className="text-white text-xl font-bold">Generated GROQ Queries</CardTitle>
              </div>
              <CardDescription className="text-slate-400 mt-2">
                Ready-to-use queries for your Sanity content
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs defaultValue="single" className="w-full">
                <TabsList className="mb-6 w-full bg-[#1e293b]/70 p-1 rounded-lg border border-[#334155]/70">
                  <TabsTrigger
                    value="single"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3b82f6]/90 data-[state=active]:to-[#8b5cf6]/90 data-[state=active]:text-white rounded-md transition-all duration-300"
                  >
                    Single Document
                  </TabsTrigger>
                  <TabsTrigger
                    value="multiple"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3b82f6]/90 data-[state=active]:to-[#8b5cf6]/90 data-[state=active]:text-white rounded-md transition-all duration-300"
                  >
                    Multiple Documents
                  </TabsTrigger>
                  {generatedQueries.slugBased && (
                    <TabsTrigger
                      value="slug"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3b82f6]/90 data-[state=active]:to-[#8b5cf6]/90 data-[state=active]:text-white rounded-md transition-all duration-300"
                    >
                      By Slug
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative">
                    <TabsContent value="single">
                      <CodeBlock
                        code={generatedQueries.singleDocument}
                        language={format}
                        title="Single Document Query"
                      />
                    </TabsContent>

                    <TabsContent value="multiple">
                      <CodeBlock
                        code={generatedQueries.multipleDocuments}
                        language={format}
                        title="Multiple Documents Query"
                      />
                    </TabsContent>

                    {generatedQueries.slugBased && (
                      <TabsContent value="slug">
                        <CodeBlock code={generatedQueries.slugBased} language={format} title="Query by Slug" />
                      </TabsContent>
                    )}
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

