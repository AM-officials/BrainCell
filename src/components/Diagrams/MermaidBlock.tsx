import { useEffect, useRef } from 'react'

interface MermaidBlockProps {
  content: string
}

// Extract mermaid diagram code from content (handles both raw and markdown-wrapped)
const extractMermaidCode = (content: string): string => {
  // Try to extract from ```mermaid code blocks
  const codeBlockMatch = content.match(/```mermaid\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }
  
  // Check if content already starts with a diagram type
  const trimmed = content.trim()
  const diagramTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey', 'gitGraph', 'C4Context']
  
  for (const type of diagramTypes) {
    if (trimmed.startsWith(type)) {
      return trimmed
    }
  }
  
  // If no diagram found, return empty string
  return ''
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isActive = true
    const renderDiagram = async () => {
      try {
        const diagramCode = extractMermaidCode(content)
        
        if (!diagramCode) {
          console.warn('No valid Mermaid diagram found in content:', content)
          if (isActive && containerRef.current) {
            containerRef.current.innerHTML =
              '<p class="text-sm text-muted-foreground">No diagram code detected</p>'
          }
          return
        }

        const mermaidModule = await import('mermaid')
        const mermaid = mermaidModule.default ?? mermaidModule

        mermaid.initialize({ startOnLoad: false, theme: 'default' })
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, diagramCode)
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
