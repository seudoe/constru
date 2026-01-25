"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWAButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler as EventListener)

    // Show install button after 3 seconds if not installed
    const timer = setTimeout(() => {
      if (!isInstalled && prompt) {
        setIsVisible(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener)
      clearTimeout(timer)
    }
  }, [prompt, isInstalled])

  const handleInstall = async () => {
    if (!prompt) return

    try {
      await prompt.prompt()
      const result = await prompt.userChoice

      if (result.outcome === 'accepted') {
        setIsInstalled(true)
      }

      setPrompt(null)
      setIsVisible(false)
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Hide for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  useEffect(() => {
    // Check dismissal state on mount
    const dismissed = sessionStorage.getItem('pwa-install-dismissed') === 'true'
    if (dismissed) {
      setIsVisible(false)
    }
  }, [])

  // Don't show if already installed, no prompt available, or not visible
  // We handle dismissal via isVisible state now
  if (!isMounted || isInstalled || !prompt || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H3m16 0v-5a2 2 0 00-2-2h-4a2 2 0 00-2 2v5"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm">Install BuildTrack</p>
            <p className="text-gray-600 text-xs">Get quick access from your home screen</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Download className="w-4 h-4 mr-1" />
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
