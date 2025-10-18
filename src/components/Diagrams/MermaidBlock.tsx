import { useEffect, useRef } from 'react'

interface MermaidBlockProps {
  content: string
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isActive = true
    const renderDiagram = async () => {
      try {
        const mermaidModule = await import('mermaid')
        const mermaid = mermaidModule.default ?? mermaidModule

        mermaid.initialize({ startOnLoad: false, theme: 'default' })
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, content)
        if (isActive && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error)
        if (isActive && containerRef.current) {
          containerRef.current.innerHTML =
            '<p class="text-sm text-muted-foreground">Error rendering diagram</p>'
        }
      }
    }

    if (containerRef.current) {
      renderDiagram()
    }

    return () => {
      isActive = false
    }
  }, [content])

  return (
    <div className="my-4 p-4 bg-muted/50 rounded-xl overflow-x-auto">
      <div ref={containerRef} className="mermaid-container" />
    </div>
  )
}
