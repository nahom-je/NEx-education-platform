/**
 * seedQuiz.js
 * Seeds an interactive practice quiz for General Psychology with questions, options, and explanations.
 * Run from backend/: node seedQuiz.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🧠 Seeding General Psychology Interactive Quiz...\n');

  // 1. Find General Psychology course
  const { data: courses, error: cErr } = await supabase
    .from('courses')
    .select('id, name')
    .ilike('name', '%General Psychology%')
    .limit(1);

  if (cErr || !courses?.length) {
    console.error('❌ Course General Psychology not found:', cErr?.message);
    process.exit(1);
  }
  const course = courses[0];
  console.log(`✅ Found course: "${course.name}" (${course.id})`);

  // 2. Check if quiz already exists
  const { data: existing } = await supabase
    .from('quizzes')
    .select('id')
    .eq('course_id', course.id)
    .eq('title', 'General Psychology Midterm & Final Practice Quiz')
    .maybeSingle();

  let quizId;
  if (existing) {
    console.log(`ℹ️ Quiz already exists (${existing.id}) — updating questions...`);
    quizId = existing.id;
    // Clear old questions to re-seed cleanly
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
  } else {
    const { data: newQuiz, error: qErr } = await supabase
      .from('quizzes')
      .insert({
        course_id: course.id,
        title: 'General Psychology Midterm & Final Practice Quiz',
        description: 'Selected high-yield questions from Jimma University Freshman Psychology exams and 500 Questions collection.'
      })
      .select()
      .single();

    if (qErr) {
      console.error('❌ Error creating quiz:', qErr.message);
      process.exit(1);
    }
    quizId = newQuiz.id;
    console.log(`✅ Created quiz (${quizId})`);
  }

  // 3. High-yield Jimma University Psychology questions
  const sampleQuestions = [
    {
      question_text: 'According to modern psychological definitions, psychology is scientifically defined as the study of:',
      options: [
        'The human soul and metaphysical spirit',
        'Behavior and mental processes',
        'Abnormal behavior and mental disorders exclusively',
        'Biological reflexes and chemical reactions only'
      ],
      correct_answer_index: 1,
      explanation: 'Psychology is formally defined as the scientific study of observable behavior and internal mental processes (cognition, emotions, thoughts).'
    },
    {
      question_text: 'Who is recognized as the "Father of Modern Psychology" for establishing the first formal psychology laboratory in Leipzig, Germany in 1879?',
      options: [
        'Sigmund Freud',
        'John B. Watson',
        'Wilhelm Wundt',
        'William James'
      ],
      correct_answer_index: 2,
      explanation: 'Wilhelm Wundt established the first experimental psychology laboratory in 1879 at the University of Leipzig, marking psychology as an independent science.'
    },
    {
      question_text: 'Which perspective in psychology emphasizes the role of the unconscious mind, unresolved childhood conflicts, and repressed desires?',
      options: [
        'Behavioral perspective',
        'Psychodynamic / Psychoanalytic perspective',
        'Cognitive perspective',
        'Humanistic perspective'
      ],
      correct_answer_index: 1,
      explanation: 'Founded by Sigmund Freud, the psychoanalytic/psychodynamic perspective focuses on unconscious drives and early childhood experiences.'
    },
    {
      question_text: 'In Pavlov\'s classical conditioning experiment with dogs, the sound of the bell after repeated pairings with food became the:',
      options: [
        'Unconditioned Stimulus (UCS)',
        'Unconditioned Response (UCR)',
        'Conditioned Stimulus (CS)',
        'Conditioned Response (CR)'
      ],
      correct_answer_index: 2,
      explanation: 'The neutral stimulus (bell) becomes the Conditioned Stimulus (CS) once the organism learns to associate it with the unconditioned stimulus (food).'
    },
    {
      question_text: 'According to Abraham Maslow\'s Hierarchy of Needs, which tier of needs represents the base and must be satisfied first?',
      options: [
        'Safety and Security needs',
        'Belongingness and Love needs',
        'Physiological needs (food, water, sleep)',
        'Self-Actualization needs'
      ],
      correct_answer_index: 2,
      explanation: 'Physiological needs (survival needs like food, water, air, sleep) form the foundational base of Maslow’s hierarchy before higher-level psychological needs can be pursued.'
    }
  ];

  const questionRecords = sampleQuestions.map(q => ({
    quiz_id: quizId,
    question_text: q.question_text,
    options: q.options,
    correct_answer_index: q.correct_answer_index,
    explanation: q.explanation
  }));

  const { error: insErr } = await supabase.from('quiz_questions').insert(questionRecords);

  if (insErr) {
    console.error('❌ Failed inserting questions:', insErr.message);
  } else {
    console.log(`✅ Successfully seeded ${sampleQuestions.length} practice questions with answers & explanations!`);
  }

  console.log('\n🎉 Done! Ready to test in the UI at /browse/freshman-natural-science/semester-1/general-psychology/quiz');
}

main().catch(console.error);

