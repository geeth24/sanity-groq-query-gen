"use client"

import { useState } from "react"
import { Copy, Check, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CodeBlockProps {
  code: string
  language: string
  title: string
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg overflow-hidden border border-[#334155]/70 bg-[#0f172a]/90 mb-4">
      <div className="bg-[#1e293b] px-4 py-3 flex justify-between items-center border-b border-[#334155]/70">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-[#a78bfa]" />
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400 mr-2 px-2 py-1 rounded bg-[#0f172a]/80 font-mono">
            {language.toUpperCase()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className={`h-8 px-3 text-xs transition-all duration-300 ${
              copied
                ? "bg-green-900/30 text-green-400 hover:bg-green-900/40 hover:text-green-400"
                : "hover:bg-[#334155]/70 text-slate-400 hover:text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="relative group">
        <pre className="p-4 overflow-x-auto bg-[#0f172a] text-sm font-mono text-slate-300 scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent">
          <code className="block whitespace-pre">{code}</code>
        </pre>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0f172a] to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}

export default CodeBlock