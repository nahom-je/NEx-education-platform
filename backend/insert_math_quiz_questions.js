const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function cleanMath(text) {
  if (!text) return '';
  let s = text;
  s = s.replace(/\\Rightarrow/g, '⇒')
       .replace(/\\Leftrightarrow/g, '⇔')
       .replace(/\\leftrightarrow/g, '↔')
       .replace(/\\to/g, '→')
       .replace(/\\vee/g, '∨')
       .replace(/\\wedge/g, '∧')
       .replace(/\\neg/g, '¬')
       .replace(/\\forall/g, '∀')
       .replace(/\\exists/g, '∃')
       .replace(/\\mathbb\{R\}/g, 'ℝ')
       .replace(/\\mathbb\{N\}/g, 'ℕ')
       .replace(/\\mathbb\{Z\}/g, 'ℤ')
       .replace(/\\mathbb\{Q\}/g, 'ℚ')
       .replace(/\\equiv/g, '≡')
       .replace(/\\times/g, '×')
       .replace(/\\neq/g, '≠')
       .replace(/\\le/g, '≤')
       .replace(/\\ge/g, '≥')
       .replace(/\\subset/g, '⊂')
       .replace(/\\subseteq/g, '⊆')
       .replace(/\\cup/g, '∪')
       .replace(/\\cap/g, '∩')
       .replace(/\\emptyset/g, '∅')
       .replace(/\\in/g, '∈')
       .replace(/\\notin/g, '∉')
       .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
       .replace(/\\dots/g, '...')
       .replace(/\\not</g, '≮')
       .replace(/\\text\{False\}/g, 'False')
       .replace(/\\text\{True\}/g, 'True')
       .replace(/\\text\{([^}]+)\}/g, '$1')
       .replace(/\\\{/g, '{')
       .replace(/\\\}/g, '}')
       .replace(/\\\$/g, '$');

  // Strip enclosing or standalone $
  s = s.replace(/\$([^$]+)\$/g, '$1');
  s = s.replace(/\$/g, '');

  return s.trim();
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function insertQuestions() {
  const courseId = 'b2fc519d-631e-46f1-a642-cfa4e7e419e2'; // Mathematics for Natural Science
  const chapter1QuizId = '956d4ea5-951f-403e-a690-e5923ef4f996'; // Chapter 1

  const rawList = require('./parsed_questions.json');
  console.log(`Loaded ${rawList.length} parsed questions.`);

  const cleanedQuestions = rawList.map(q => ({
    original_number: q.number,
    question_text: cleanMath(q.question_text),
    options: q.options.map(cleanMath),
    correct_answer_index: q.correct_answer_index,
    explanation: cleanMath(q.explanation)
  }));

  // 1. Check or create "Mathematics Mock Exam (MATH-1011)"
  let { data: mockQuiz, error: mockErr } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .ilike('title', '%Mock Exam%')
    .maybeSingle();

  if (!mockQuiz) {
    console.log('Creating "Mathematics Mock Exam (MATH-1011)" quiz...');
    const { data: newQuiz, error: createErr } = await supabase
      .from('quizzes')
      .insert({
        course_id: courseId,
        title: 'Mathematics Mock Exam (MATH-1011)',
        description: 'Comprehensive 24-question university mock exam covering propositional logic, quantifiers, tautologies, contradictions, and arguments.'
      })
      .select()
      .single();

    if (createErr) {
      console.error('Error creating mock quiz:', createErr);
      throw createErr;
    }
    mockQuiz = newQuiz;
    console.log('Created Mock Quiz ID:', mockQuiz.id);
  } else {
    console.log('Found existing Mock Quiz ID:', mockQuiz.id);
  }

  // Delete any existing questions in mockQuiz to ensure clean fresh set
  const { error: delMockErr } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('quiz_id', mockQuiz.id);

  if (delMockErr) {
    console.warn('Warning deleting old mock questions:', delMockErr);
  }

  // Insert all 24 questions in randomized order into mockQuiz
  const shuffledMockQuestions = shuffleArray(cleanedQuestions);
  const baseTime = Date.now();
  const mockInserts = shuffledMockQuestions.map((q, idx) => ({
    quiz_id: mockQuiz.id,
    question_text: q.question_text,
    options: q.options,
    correct_answer_index: q.correct_answer_index,
    explanation: q.explanation,
    created_at: new Date(baseTime + idx * 1000).toISOString()
  }));

  const { error: insMockErr } = await supabase
    .from('quiz_questions')
    .insert(mockInserts);

  if (insMockErr) {
    console.error('Error inserting mock questions:', insMockErr);
    throw insMockErr;
  }
  console.log(`Successfully inserted ${mockInserts.length} randomized questions into Mock Exam.`);

  // 2. Also insert them randomly into Chapter 1 (Propositional Logic and Set Theory)
  // Check if they are already in Chapter 1
  const { data: existingCh1Qns } = await supabase
    .from('quiz_questions')
    .select('id, question_text')
    .eq('quiz_id', chapter1QuizId);

  const existingTexts = new Set((existingCh1Qns || []).map(q => q.question_text));
  const newForCh1 = cleanedQuestions.filter(q => !existingTexts.has(q.question_text));

  console.log(`New questions to add to Chapter 1: ${newForCh1.length} of ${cleanedQuestions.length}`);

  if (newForCh1.length > 0) {
    // Generate random timestamps between existing Chapter 1 timestamps or random offsets
    const ch1Inserts = shuffleArray(newForCh1).map((q, idx) => {
      // Randomize timestamp so they interleave randomly
      const randomOffset = Math.floor(Math.random() * 1000000) - 500000;
      return {
        quiz_id: chapter1QuizId,
        question_text: q.question_text,
        options: q.options,
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation,
        created_at: new Date(baseTime + randomOffset + idx * 1000).toISOString()
      };
    });

    const { error: insCh1Err } = await supabase
      .from('quiz_questions')
      .insert(ch1Inserts);

    if (insCh1Err) {
      console.error('Error inserting into Chapter 1:', insCh1Err);
      throw insCh1Err;
    }
    console.log(`Successfully added ${ch1Inserts.length} randomized questions into Chapter 1.`);
  }

  // 3. Verify total counts
  const { count: ch1Total } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', chapter1QuizId);

  const { count: mockTotal } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', mockQuiz.id);

  console.log(`\nVerification:`);
  console.log(`- Chapter 1 Total Questions: ${ch1Total}`);
  console.log(`- Mock Exam Total Questions: ${mockTotal}`);
}

insertQuestions().catch(console.error);
