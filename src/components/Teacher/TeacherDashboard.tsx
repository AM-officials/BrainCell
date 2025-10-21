import { useState, useEffect } from 'react'
import { Users, TrendingDown, AlertCircle, CheckCircle, Plus, LogIn } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8002/api/v1'

interface Classroom {
  classroom_id: string
  teacher_id: string
  teacher_name: string
  name: string
  subject: string | null
  grade_level: string | null
  join_code: string
  is_active: boolean
  created_at: string
  student_count: number
}

interface StudentAnalytics {
  student_id: string
  student_name: string
  total_sessions: number
  avg_mastery: number
  concepts_struggling: number
  concepts_mastered: number
  total_confused_count: number
  total_frustrated_count: number
  last_active: string
  needs_help: boolean
}

interface ConceptStats {
  concept_id: string
  concept_name: string
  topic: string
  avg_mastery: number
  total_attempts: number
  students_struggling: number
  students_mastered: number
}

interface ClassroomAnalytics {
  classroom_id: string
  classroom_name: string
  total_students: number
  active_students: number
  concepts: ConceptStats[]
  most_confused_topics: string[]
  students_needing_help: StudentAnalytics[]
  avg_class_mastery: number
  total_sessions: number
}

interface TeacherDashboardProps {
  teacherId: string
  teacherName: string
  onLogout: () => void
}

export function TeacherDashboard({ teacherId, teacherName, onLogout }: TeacherDashboardProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<ClassroomAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClassroomName, setNewClassroomName] = useState('')
  const [newClassroomSubject, setNewClassroomSubject] = useState('')
  const [newClassroomGrade, setNewClassroomGrade] = useState('')

  // Load teacher's classrooms
  useEffect(() => {
    loadClassrooms()
  }, [teacherId])

  // Load analytics when classroom is selected
  useEffect(() => {
    if (selectedClassroom) {
      loadAnalytics(selectedClassroom)
      
      // Poll for updates every 10 seconds when classroom is selected
      const interval = setInterval(() => {
        loadAnalytics(selectedClassroom)
        loadClassrooms() // Also refresh classroom list to update student counts
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [selectedClassroom])

  const loadClassrooms = async () => {
    try {
      const isInitialLoad = classrooms.length === 0
      if (isInitialLoad) {
        setLoading(true)
      }
      
      const response = await axios.get(`${API_BASE}/classroom/teacher/${teacherId}`)
      setClassrooms(response.data)
      
      // Auto-select first classroom if available and nothing is selected
      if (response.data.length > 0 && !selectedClassroom) {
        setSelectedClassroom(response.data[0].classroom_id)
      }
    } catch (error) {
      console.error('Failed to load classrooms:', error)
    } finally {
      if (classrooms.length === 0) {
        setLoading(false)
      }
    }
  }

  const loadAnalytics = async (classroomId: string) => {
    try {
      // Only show loading spinner on initial load
      if (!analytics) {
        setAnalyticsLoading(true)
      }
      
      console.log('Loading analytics for classroom:', classroomId)
      const response = await axios.get(`${API_BASE}/classroom/${classroomId}/analytics`)
      console.log('Analytics response:', response.data)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // If backend is down or endpoint fails, set empty analytics to show "no activity" message
      if (!analytics) {
        const classroom = classrooms.find(c => c.classroom_id === classroomId)
        setAnalytics({
          classroom_id: classroomId,
          classroom_name: classroom?.name || 'Unknown',
          total_students: 0,
          active_students: 0,
          avg_class_mastery: 0,
          total_sessions: 0,
          concepts: [],
          students_needing_help: [],
          most_confused_topics: []
        })
      }
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const createClassroom = async () => {
    if (!newClassroomName.trim()) return

    try {
      const response = await axios.post(`${API_BASE}/classroom/create`, {
        teacher_id: teacherId,
        teacher_name: teacherName,
        name: newClassroomName,
        subject: newClassroomSubject || null,
        grade_level: newClassroomGrade || null,
      })

      setClassrooms([...classrooms, response.data])
      setSelectedClassroom(response.data.classroom_id)
      setShowCreateModal(false)
      setNewClassroomName('')
      setNewClassroomSubject('')
      setNewClassroomGrade('')
    } catch (error) {
      console.error('Failed to create classroom:', error)
    }
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.7) return 'text-green-600'
    if (mastery >= 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMasteryBg = (mastery: number) => {
    if (mastery >= 0.7) return 'bg-green-100 border-green-200'
    if (mastery >= 0.4) return 'bg-yellow-100 border-yellow-200'
    return 'bg-red-100 border-red-200'
  }

  const currentClassroom = classrooms.find(c => c.classroom_id === selectedClassroom)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading classroom data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {teacherName}!</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Classroom Selection & Creation */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <select
              value={selectedClassroom || ''}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a classroom</option>
              {classrooms.map((classroom) => (
                <option key={classroom.classroom_id} value={classroom.classroom_id}>
                  {classroom.name} ({classroom.student_count} students)
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Classroom
          </button>
        </div>

        {/* Create Classroom Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Classroom</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Classroom Name *</label>
                  <input
                    type="text"
                    value={newClassroomName}
                    onChange={(e) => setNewClassroomName(e.target.value)}
                    placeholder="e.g., Physics 101"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input
                    type="text"
                    value={newClassroomSubject}
                    onChange={(e) => setNewClassroomSubject(e.target.value)}
                    placeholder="e.g., Physics"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grade Level</label>
                  <input
                    type="text"
                    value={newClassroomGrade}
                    onChange={(e) => setNewClassroomGrade(e.target.value)}
                    placeholder="e.g., 10th"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createClassroom}
                    disabled={!newClassroomName.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join Code Display */}
        {currentClassroom && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Student Join Code</p>
                <p className="text-2xl font-mono font-bold text-primary">{currentClassroom.join_code}</p>
              </div>
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Share this code with students to join your classroom
            </p>
          </div>
        )}

        {/* Analytics Loading State */}
        {analyticsLoading && !analytics && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading classroom analytics...</p>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        {analytics && analytics.total_students === 0 && (
          <div className="p-12 text-center bg-card border border-border rounded-xl">
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Student Activity Yet</h3>
            <p className="text-muted-foreground mb-4">
              Students need to join the classroom and start learning sessions for analytics to appear.
            </p>
            <p className="text-sm text-muted-foreground">
              Share the classroom code <span className="font-mono font-bold">{classrooms.find(c => c.classroom_id === selectedClassroom)?.join_code}</span> with your students.
            </p>
          </div>
        )}
        
        {analytics && analytics.total_students > 0 && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{analytics.total_students}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>

              <div className="p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{Math.round(analytics.avg_class_mastery * 100)}%</span>
                </div>
                <p className="text-sm text-muted-foreground">Avg Class Mastery</p>
              </div>

              <div className="p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold">{analytics.students_needing_help.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Students Need Help</p>
              </div>

              <div className="p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold">{analytics.most_confused_topics.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Confused Topics</p>
              </div>
            </div>

            {/* Students Needing Help */}
            {analytics.students_needing_help.length > 0 && (
              <div className="p-6 bg-card border border-border rounded-xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Students Needing Help
                </h2>
                <div className="space-y-3">
                  {analytics.students_needing_help.map((student) => (
                    <div
                      key={student.student_id}
                      className={`p-4 border rounded-lg ${getMasteryBg(student.avg_mastery)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{student.student_name}</h3>
                        <span className={`text-sm font-medium ${getMasteryColor(student.avg_mastery)}`}>
                          {Math.round(student.avg_mastery * 100)}% Mastery
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sessions: </span>
                          <span className="font-medium">{student.total_sessions}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Struggling: </span>
                          <span className="font-medium text-red-600">{student.concepts_struggling}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confused: </span>
                          <span className="font-medium text-orange-600">{student.total_confused_count}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frustrated: </span>
                          <span className="font-medium text-red-600">{student.total_frustrated_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Confused Topics */}
            {analytics.most_confused_topics.length > 0 && (
              <div className="p-6 bg-card border border-border rounded-xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  Most Confused Topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analytics.most_confused_topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Concept Mastery Breakdown */}
            {analytics.concepts.length > 0 && (
              <div className="p-6 bg-card border border-border rounded-xl">
                <h2 className="text-xl font-bold mb-4">Concept Mastery Breakdown</h2>
                <div className="space-y-3">
                  {analytics.concepts.map((concept) => (
                    <div key={concept.concept_id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{concept.concept_name}</h3>
                          <p className="text-xs text-muted-foreground">{concept.topic}</p>
                        </div>
                        <span className={`text-lg font-bold ${getMasteryColor(concept.avg_mastery)}`}>
                          {Math.round(concept.avg_mastery * 100)}%
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Attempts: </span>
                          <span className="font-medium">{concept.total_attempts}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Struggling: </span>
                          <span className="font-medium text-red-600">{concept.students_struggling}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mastered: </span>
                          <span className="font-medium text-green-600">{concept.students_mastered}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedClassroom && classrooms.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Classrooms Yet</h2>
            <p className="text-muted-foreground mb-6">Create your first classroom to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Classroom
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
