/**
 * removeGuessedYears.js
 * 
 * Reverts blanket/guessed years from photo exams.
 * Removes the "photo_2026..." part completely.
 * Does NOT write a year unless the file has a verified year in its original name or header.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔄 Cleaning exam titles: removing photo_2026 and removing guessed years...\n');

  const { data: resources, error } = await supabase
    .from('resources')
    .select('id, title, type, file_url, course_id, courses(name)')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching resources:', error);
    process.exit(1);
  }

  const counters = {};
  let updatedCount = 0;

  for (const r of resources) {
    // Check if it's one of the photo exam pages
    const isPhoto = r.file_url?.includes('photo_') || r.title.includes('photo_') || r.title.includes(' - Page ');

    if (isPhoto) {
      const courseName = r.courses?.name || '';
      const isLogic = courseName.includes('Logic');
      const examPrefix = isLogic ? 'Final Exam' : 'Mid Exam';

      const groupKey = courseName;
      counters[groupKey] = (counters[groupKey] || 0) + 1;
      const partNum = counters[groupKey];

      // DO NOT invent a year. Only remove the photo_ part and format cleanly
      const cleanTitle = `${examPrefix} – ${courseName} - Part ${partNum}`;

      const { error: updErr } = await supabase
        .from('resources')
        .update({
          title: cleanTitle,
          type: isLogic ? 'final_exam' : 'mid_exam'
        })
        .eq('id', r.id);

      if (updErr) {
        console.error(`❌ Error updating ${r.id}:`, updErr.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} exam titles to clean Part format with no guessed years!`);
}

main().catch(console.error);

