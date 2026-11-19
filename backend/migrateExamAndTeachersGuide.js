/**
 * migrateExamAndTeachersGuide.js
 * 
 * 1. Reclassifies all 'other' resources -> 'teachers_guide'
 * 2. Splits 'exam' resources into 'mid_exam' and 'final_exam'
 * 3. Reclassifies question collections -> 'questions'
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('🔄 Starting migration for Mid Exam, Final Exam, and Teacher\'s Guide...\n');

  // 1. Convert 'other' -> 'teachers_guide'
  const { data: others, error: othErr } = await supabase
    .from('resources')
    .select('id, title')
    .eq('type', 'other');

  if (othErr) {
    console.error('Error fetching other:', othErr);
  } else {
    console.log(`Found ${others.length} 'other' resources. Converting to 'teachers_guide'...`);
    for (const r of others) {
      await supabase
        .from('resources')
        .update({ type: 'teachers_guide' })
        .eq('id', r.id);
      console.log(`  ✅ [Teacher's Guide] ${r.title}`);
    }
  }

  // 2. Re-classify 'questions' collections
  const { data: qResources } = await supabase
    .from('resources')
    .select('id, title')
    .or('title.ilike.%500 psyco%,title.ilike.%question%');

  for (const q of (qResources || [])) {
    await supabase.from('resources').update({ type: 'questions' }).eq('id', q.id);
    console.log(`  ✅ [Questions Collection] ${q.title}`);
  }

  // 3. Process all 'exam' resources -> split into 'mid_exam' vs 'final_exam'
  const { data: exams, error: exErr } = await supabase
    .from('resources')
    .select('id, title, file_url, description')
    .or('type.eq.exam,type.eq.mid_exam,type.eq.final_exam');

  if (exErr) {
    console.error('Error fetching exams:', exErr);
    return;
  }

  console.log(`\nAnalyzing ${exams.length} exam resources...`);
  let midCount = 0;
  let finalCount = 0;

  for (const e of exams) {
    const text = `${e.title} ${e.file_url} ${e.description || ''}`.toLowerCase();
    
    // Check if it's a Final Exam
    const isFinal = text.includes('final') || text.includes('model exam');

    const newType = isFinal ? 'final_exam' : 'mid_exam';

    // Build cleaner title if needed
    let newTitle = e.title;
    if (isFinal) {
      finalCount++;
      if (!newTitle.toLowerCase().includes('final')) {
        newTitle = newTitle.replace(/^Exam –/i, 'Final Exam –');
      }
    } else {
      midCount++;
      if (!newTitle.toLowerCase().includes('mid')) {
        newTitle = newTitle.replace(/^Exam –/i, 'Mid Exam –');
      }
    }

    await supabase
      .from('resources')
      .update({
        type: newType,
        title: newTitle
      })
      .eq('id', e.id);
  }

  console.log(`\n✅ Exam categorization summary:`);
  console.log(`   • Mid Exams   : ${midCount}`);
  console.log(`   • Final Exams : ${finalCount}`);

  // Print final distribution across all types
  const { data: allResources } = await supabase.from('resources').select('type');
  const distribution = {};
  (allResources || []).forEach(r => {
    distribution[r.type] = (distribution[r.type] || 0) + 1;
  });

  console.log('\n📊 Final Resource Type Distribution:');
  console.table(distribution);
  console.log('\nMigration complete! 🎉');
}

run().catch(console.error);

