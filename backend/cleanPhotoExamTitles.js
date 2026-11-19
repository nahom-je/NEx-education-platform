/**
 * cleanPhotoExamTitles.js
 * 
 * Removes all "photo_2026..." substrings from exam titles and replaces them
 * with the verified extracted academic years from the exam paper headers:
 * 
 * - Communicative English: 2022 (from Feb 2, 2022 header)
 * - Geography: 2022 (from Academic Year: 2022 header)
 * - Mathematics: 2021 (from August 09, 2021 header)
 * - General Physics: 2024 (from 2024/2025 academic calendar header)
 * - Logic: (no year in header, so only removes photo_2026 part)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COURSE_YEARS = {
  'Communicative English Language 1': '2022',
  'Geography': '2022',
  'Mathematics for Natural Science': '2021',
  'General Physics': '2024',
  'General Psychology': '2022',
  'Logic and Critical Thinking': '' // no year in photo header
};

async function main() {
  console.log('🧹 Cleaning exam titles and adding extracted years...\n');

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
    if (r.title.includes('photo_')) {
      const courseName = r.courses?.name || '';
      const year = COURSE_YEARS[courseName] || '';
      const isLogic = courseName.includes('Logic');
      const examPrefix = isLogic ? 'Final Exam' : 'Mid Exam';
      const targetType = isLogic ? 'final_exam' : 'mid_exam';

      const groupKey = courseName;
      counters[groupKey] = (counters[groupKey] || 0) + 1;
      const pageNum = counters[groupKey];

      let cleanTitle;
      if (year) {
        cleanTitle = `${examPrefix} – ${courseName} (${year}) - Page ${pageNum}`;
      } else {
        cleanTitle = `${examPrefix} – ${courseName} - Page ${pageNum}`;
      }

      const { error: updErr } = await supabase
        .from('resources')
        .update({
          title: cleanTitle,
          type: targetType
        })
        .eq('id', r.id);

      if (updErr) {
        console.error(`❌ Error updating ${r.id}:`, updErr.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 Successfully cleaned and updated ${updatedCount} exam titles!`);
}

main().catch(console.error);

