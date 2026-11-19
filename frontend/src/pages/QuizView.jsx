import { API_BASE } from '../utils/config';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  HelpCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, 
  Award, Sparkles, BookOpen, AlertCircle, ChevronLeft, ArrowLeft, Layers, Lightbulb
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

export default function QuizView() {
  const { categorySlug, semesterSlug, courseSlug } = useParams()

  const [quizzes, setQuizzes] = useState([])
  const [selectedQuizId, setSelectedQuizId] = useState(null)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [answeredState, setAnsweredState] = useState({}) // { [questionId]: selectedOptionIndex }

  // 1. Fetch available quizzes / chapters for this course
  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/quizzes/course/${courseSlug}`)
      .then((res) => res.json())
      .then((list) => {
        const quizList = list || []
        setQuizzes(quizList)

        // If exactly 1 quiz (like English), auto-select it directly
        if (quizList.length === 1) {
          handleSelectQuiz(quizList[0]._id || quizList[0].id)
        }
      })
      .catch((err) => console.error('Error fetching quizzes:', err))
      .finally(() => setLoading(false))
  }, [courseSlug])

  // 2. Load questions for a selected chapter/quiz
  const handleSelectQuiz = (quizId) => {
    setSelectedQuizId(quizId)
    setLoadingQuestions(true)
    setAnsweredState({})

    fetch(`${API_BASE}/api/quizzes/${quizId}`)
      .then((res) => res.json())
      .then((data) => setActiveQuiz(data))
      .catch((err) => console.error('Error loading quiz:', err))
      .finally(() => setLoadingQuestions(false))
  }

  // Instant evaluation when clicking an option
  const handleAnswerQuestion = (questionId, optionIndex) => {
    if (answeredState[questionId] !== undefined) return // Already answered
    setAnsweredState((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }))
  }

  const handleResetQuiz = () => {
    setAnsweredState({})
  }

  const handleBackToChapters = () => {
    setSelectedQuizId(null)
    setActiveQuiz(null)
    setAnsweredState({})
  }

  const courseDisplayName = courseSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  const hasMultipleChapters = quizzes.length > 1

  // Calculate live score
  const questions = activeQuiz?.questions || []
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answeredState).length
  let correctCount = 0
  questions.forEach((q) => {
    const chosen = answeredState[q._id || q.id]
    if (chosen !== undefined && chosen === q.correct_answer_index) {
      correctCount++
    }
  })
  const isFinished = totalQuestions > 0 && answeredCount === totalQuestions
  const scorePercentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Category', href: `/browse/${categorySlug}` },
          { label: 'Semester', href: `/browse/${categorySlug}/${semesterSlug}` },
          { label: courseDisplayName, href: `/browse/${categorySlug}/${semesterSlug}/${courseSlug}` },
          { label: activeQuiz ? activeQuiz.title : 'Practice Quizzes' }
        ]}
        backTo={
          activeQuiz && hasMultipleChapters
            ? undefined
            : `/browse/${categorySlug}/${semesterSlug}/${courseSlug}`
        }
      />

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 bg-gray-100 animate-pulse rounded-2xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        </div>
      ) : quizzes.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center my-6">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">
            No Practice Quizzes Configured Yet
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
            You can practice with the past exam papers and files for this course!
          </p>
          <Link
            to={`/browse/${categorySlug}/${semesterSlug}/${courseSlug}`}
            className="inline-flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            <span>Back to Course Materials</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : !activeQuiz || (hasMultipleChapters && !selectedQuizId) ? (
        /* VIEW 1: CHAPTER SELECTOR (For Physics, Psychology, Geography, Logic, Maths) */
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Practice Quizzes & Mock Exams</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {courseDisplayName} — Choose a Practice Chapter or Mock Exam
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Select any chapter or mock exam. When you click an answer, you'll immediately see if you are right or wrong and read the step-by-step explanation.
            </p>
          </div>

          {/* Chapters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((q, idx) => (
              <button
                key={q._id || q.id}
                onClick={() => handleSelectQuiz(q._id || q.id)}
                className="group text-left bg-white border border-gray-200 hover:border-[#0D9488] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-teal-50 text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white font-bold text-xs flex items-center justify-center transition-colors">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 group-hover:bg-teal-50 group-hover:text-[#0D9488] transition-colors">
                      {q.question_count} Questions
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 group-hover:text-[#0D9488] transition-colors text-base line-clamp-2">
                    {q.title}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {q.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100 text-xs font-semibold text-gray-500 group-hover:text-[#0D9488] transition-colors">
                  <span>Start Practice Quiz</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : loadingQuestions ? (
        <div className="space-y-4">
          <div className="h-28 bg-gray-100 animate-pulse rounded-2xl"></div>
          <div className="h-40 bg-gray-100 animate-pulse rounded-2xl"></div>
        </div>
      ) : (
        /* VIEW 2: ACTIVE INTERACTIVE WORKSHEET WITH INSTANT FEEDBACK */
        <div className="space-y-6">
          {/* Top Bar with Navigation & Live Score */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {hasMultipleChapters ? (
              <button
                onClick={handleBackToChapters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#0D9488] bg-gray-100 hover:bg-teal-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← All Chapters</span>
              </button>
            ) : <div />}

            {/* Live Progress Bar & Score */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="text-gray-500">
                Answered: <strong className="text-gray-900">{answeredCount}</strong> / {totalQuestions}
              </span>
              {answeredCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] font-bold">
                  <span>Score: {correctCount}/{answeredCount}</span>
                  <span>({scorePercentage}%)</span>
                </span>
              )}
            </div>
          </div>

          {/* Worksheet Header */}
          <div className="bg-gradient-to-r from-[#1F2937] to-[#111827] text-white rounded-2xl p-6 shadow-sm">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Instant Feedback Mode · {totalQuestions} Questions</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {activeQuiz.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Click an option on any question below to immediately see if you are correct and read the detailed explanation!
            </p>
          </div>

          {/* Completion Celebration Card (When all questions answered) */}
          {isFinished && (
            <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-[#1F2937] text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center flex-shrink-0">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Quiz Complete! 🎉</h3>
                  <p className="text-sm text-gray-200">
                    Final Score: <span className="font-extrabold text-teal-300 text-base">{correctCount}</span> out of{' '}
                    <span className="font-extrabold">{totalQuestions}</span> ({Math.round((correctCount / totalQuestions) * 100)}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetQuiz}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-teal-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Practice Again</span>
                </button>
                {hasMultipleChapters && (
                  <button
                    onClick={handleBackToChapters}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <span>Next Chapter →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-5">
            {questions.map((q, qIndex) => {
              const qId = q._id || q.id
              const selectedIdx = answeredState[qId]
              const isAnswered = selectedIdx !== undefined
              const isCorrect = isAnswered && selectedIdx === q.correct_answer_index

              return (
                <div
                  key={qId}
                  className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-200 ${
                    isAnswered
                      ? isCorrect
                        ? 'border-teal-400 bg-teal-50/10'
                        : 'border-red-300 bg-red-50/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Question Title & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {qIndex + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
                        {q.question_text}
                      </h3>
                    </div>

                    {isAnswered && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                          isCorrect
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="space-y-2.5 pl-9">
                    {(q.options || []).map((opt, optIdx) => {
                      const isChosen = selectedIdx === optIdx
                      const isTheCorrectOption = q.correct_answer_index === optIdx

                      let optionClasses = 'border-gray-200 bg-white hover:border-[#0D9488] hover:bg-gray-50'

                      if (isAnswered) {
                        if (isTheCorrectOption) {
                          // Correct option is always highlighted green
                          optionClasses = 'border-teal-500 bg-teal-50 text-teal-900 font-medium ring-1 ring-teal-500'
                        } else if (isChosen && !isCorrect) {
                          // The option the user chose wrongly is highlighted red
                          optionClasses = 'border-red-400 bg-red-50 text-red-900'
                        } else {
                          // Other unchosen options
                          optionClasses = 'border-gray-100 text-gray-400 opacity-60'
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleAnswerQuestion(qId, optIdx)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all ${
                            isAnswered ? 'cursor-default' : 'cursor-pointer'
                          } ${optionClasses}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                                isAnswered && isTheCorrectOption
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : isAnswered && isChosen && !isCorrect
                                  ? 'bg-red-500 text-white border-red-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {isAnswered && (
                            <div>
                              {isTheCorrectOption && (
                                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                              )}
                              {isChosen && !isCorrect && (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Instant Explanation Box (Revealed as soon as answered) */}
                  {isAnswered && (
                    <div
                      className={`mt-4 ml-9 p-3.5 rounded-xl text-xs border leading-relaxed animate-in fade-in duration-200 ${
                        isCorrect
                          ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Lightbulb className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isCorrect ? 'text-teal-600' : 'text-amber-600'}`} />
                        <div>
                          <strong className="block mb-0.5">
                            {isCorrect ? 'Why this is correct:' : 'Explanation & Correct Concept:'}
                          </strong>
                          <span>{q.explanation || `The correct option is ${String.fromCharCode(65 + q.correct_answer_index)}.`}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Reset button at bottom if partially answered */}
          {answeredCount > 0 && !isFinished && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleResetQuiz}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Answers</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
