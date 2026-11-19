const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

/**
 * 1. GET /api/quizzes/course/:courseIdentifier
 * Get quizzes for a given course (by UUID or slug)
 */
router.get('/course/:courseIdentifier', async (req, res) => {
  const { courseIdentifier } = req.params;
  try {
    // Check if courseIdentifier is UUID or slug
    let courseId = courseIdentifier;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseIdentifier);

    if (!isUUID) {
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .or(`slug.eq.${courseIdentifier},name.ilike.%${courseIdentifier.replace(/-/g, ' ')}%`)
        .limit(1)
        .maybeSingle();

      if (!course) return res.status(404).json({ error: 'Course not found' });
      courseId = course.id;
    }

    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, title, description, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch question counts per quiz
    const quizList = await Promise.all((quizzes || []).map(async q => {
      const { count } = await supabase
        .from('quiz_questions')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', q.id);

      return {
        ...q,
        _id: q.id,
        question_count: count || 0
      };
    }));

    res.json(quizList);
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

/**
 * 2. GET /api/quizzes/:quizId
 * Get a quiz and its questions with options, correct answer, and explanation for instant feedback mode
 */
router.get('/:quizId', async (req, res) => {
  const { quizId } = req.params;
  try {
    const { data: quiz, error: qErr } = await supabase
      .from('quizzes')
      .select('id, title, description, course_id, created_at')
      .eq('id', quizId)
      .single();

    if (qErr || !quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { data: questions, error: qnsErr } = await supabase
      .from('quiz_questions')
      .select('id, question_text, options, correct_answer_index, explanation')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: true });

    if (qnsErr) throw qnsErr;

    let list = (questions || []).map(q => ({
      ...q,
      _id: q.id
    }));

    // Randomize order if shuffle=true or for Mock Exams
    if (req.query.shuffle === 'true' || (quiz.title && /mock|exam/i.test(quiz.title))) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }

    res.json({
      ...quiz,
      _id: quiz.id,
      questions: list
    });
  } catch (err) {
    console.error('Error loading quiz:', err);
    res.status(500).json({ error: 'Failed to load quiz' });
  }
});

/**
 * 3. POST /api/quizzes/:quizId/submit
 * Submit answers and get instant grade, correct answers, and explanations
 * Body: { answers: { [questionId]: selectedOptionIndex } }
 */
router.post('/:quizId/submit', async (req, res) => {
  const { quizId } = req.params;
  const { answers = {} } = req.body;

  try {
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, question_text, options, correct_answer_index, explanation')
      .eq('quiz_id', quizId);

    if (error) throw error;

    let score = 0;
    const total = (questions || []).length;

    const results = (questions || []).map(q => {
      const selectedIndex = answers[q.id];
      const isCorrect = selectedIndex !== undefined && selectedIndex === q.correct_answer_index;
      if (isCorrect) score++;

      return {
        questionId: q.id,
        question_text: q.question_text,
        options: q.options,
        selectedIndex,
        correct_answer_index: q.correct_answer_index,
        isCorrect,
        explanation: q.explanation || ''
      };
    });

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    res.json({
      score,
      total,
      percentage,
      results
    });
  } catch (err) {
    console.error('Error grading quiz:', err);
    res.status(500).json({ error: 'Failed to grade quiz' });
  }
});

/**
 * 4. POST /api/quizzes
 * Create quiz and questions (Admin only or authenticated)
 */
router.post('/', authMiddleware, async (req, res) => {
  const { course_id, title, description, questions = [] } = req.body;

  if (!title || !course_id) {
    return res.status(400).json({ error: 'Title and course_id are required' });
  }

  try {
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .insert({ course_id, title, description })
      .select()
      .single();

    if (quizErr) throw quizErr;

    if (questions.length > 0) {
      const formatted = questions.map(q => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation || null
      }));

      const { error: qnsErr } = await supabase
        .from('quiz_questions')
        .insert(formatted);

      if (qnsErr) throw qnsErr;
    }

    res.status(201).json({ ...quiz, _id: quiz.id });
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

module.exports = router;

