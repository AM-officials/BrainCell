/**
 * BrainCell v1.2 - Feature 2.0: Learning Report
 * Comprehensive view of student's knowledge gaps and progress
 */

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConceptData {
  id: string
  name: string
  mastery: number
  attempts: number
  confused_count: number
  frustrated_count: number
}

interface LearningReport {
  student_id: string
  topic: string | null
  total_concepts: number
  gaps: ConceptData[]
  struggling: ConceptData[]
  strong: ConceptData[]
  moderate: number
  recommendations: string[]
  overall_progress: number
  last_updated: string
}

interface LearningReportProps {
  studentId: string
  topic?: string
}

export const LearningReport: React.FC<LearningReportProps> = ({ studentId, topic }) => {
  const [report, setReport] = useState<LearningReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        const url = topic
          ? `/api/v1/session/learning-report/${studentId}?topic=${encodeURIComponent(topic)}`
          : `/api/v1/session/learning-report/${studentId}`
        
        const response = await fetch(url)
        
        // Check if response is OK
        if (!response.ok) {
          setError(`Failed to load report: ${response.status}`)
          setLoading(false)
          return
        }
        
        const data = await response.json()
        
        if (data.error) {
          setError(data.message || 'Failed to load report')
        } else {
          setReport(data)
        }
      } catch (err) {
        setError('Failed to load learning report. Please start a session first.')
        console.error('LearningReport fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [studentId, topic])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-muted/50 rounded-xl">
        <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
      </div>
    )
  }

  if (report.total_concepts === 0) {
    return (
      <div className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl text-center">
        <Brain className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Start Learning!</h3>
        <p className="text-sm text-muted-foreground">
          Your learning report will appear here once you begin studying.
        </p>
      </div>
    )
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.7) return 'text-green-500 bg-green-500/10'
    if (mastery >= 0.4) return 'text-blue-500 bg-blue-500/10'
    return 'text-red-500 bg-red-500/10'
  }

  const getMasteryLabel = (mastery: number) => {
    if (mastery >= 0.7) return 'Strong'
    if (mastery >= 0.4) return 'Moderate'
    return 'Weak'
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Learning Report</h2>
          <div className="text-sm text-muted-foreground">
            {report.total_concepts} concepts tracked
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-2xl font-bold text-primary">{report.overall_progress}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
              style={{ width: `${report.overall_progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Personalized Recommendations
          </h3>
          <ul className="space-y-2">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Knowledge Gaps (Weak Areas) */}
      {report.gaps.length > 0 && (
        <div className="p-6 bg-card rounded-xl border border-red-500/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            Priority Review Needed
          </h3>
          <div className="space-y-3">
            {report.gaps.map((concept) => (
              <div key={concept.id} className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{concept.name}</span>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getMasteryColor(concept.mastery))}>
                    {Math.round(concept.mastery * 100)}% mastered
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{concept.attempts} attempts</span>
                  {concept.confused_count > 0 && (
                    <span className="text-orange-500">😕 {concept.confused_count}× confused</span>
                  )}
                  {concept.frustrated_count > 0 && (
                    <span className="text-red-500">😤 {concept.frustrated_count}× frustrated</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Struggling Concepts */}
      {report.struggling.length > 0 && (
        <div className="p-6 bg-card rounded-xl border border-orange-500/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-500">
            <TrendingDown className="h-5 w-5" />
            Challenging Topics
          </h3>
          <div className="space-y-3">
            {report.struggling.map((concept) => (
              <div key={concept.id} className="p-3 bg-orange-500/5 rounded-lg border border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{concept.name}</span>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getMasteryColor(concept.mastery))}>
                    {getMasteryLabel(concept.mastery)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-orange-500 font-medium">
                    High confusion pattern detected
                  </span>{' '}
                  - Try a different learning approach or ask for more examples
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Areas */}
      {report.strong.length > 0 && (
        <div className="p-6 bg-card rounded-xl border border-green-500/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            Mastered Concepts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.strong.map((concept) => (
              <div key={concept.id} className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{concept.name}</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(concept.mastery * 100)}% mastery · {concept.attempts} sessions
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(report.last_updated).toLocaleString()}
      </div>
    </div>
  )
}
