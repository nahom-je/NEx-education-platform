/**
 * seedResources.js
 * Bulk-seeds all files from the Resourses/ folder into Supabase.
 * Safe to run multiple times — skips files already in the DB.
 *
 * Run from backend/:  node seedResources.js
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Config ───────────────────────────────────────────────────────────────────
const RESOURSES_ROOT = path.resolve(
  __dirname,
  '../Resourses/Natural Science 1st semester'
);
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const ADMIN_ID    = 'b8e6e509-b884-4729-ac77-9ae31cae92ce';
const UNIVERSITY  = 'Jimma University';
const SEMESTER    = 'Semester 1';

// Map local folder name → Supabase course name
const FOLDER_TO_COURSE = {
  English:   'Communicative English Language 1',
  Geography: 'Geography',
  Logic:     'Logic and Critical Thinking',
  Maths:     'Mathematics for Natural Science',
  Physics:   'General Physics',
  Psychology:'General Psychology',
};

// Map sub-folder → resource type
function getType(subFolder) {
  const f = subFolder.toLowerCase();
  if (f === 'exams')                              return 'exam';
  if (f === 'module' || f === 'modules')          return 'notes';
  if (f === 'ppt')                                return 'notes';
  if (f === 'worksheet' || f === 'worksheets')    return 'assignment';
  if (f === 'teachers_guide')                     return 'other';
  if (f === 'serway')                             return 'notes';   // Physics textbook
  if (f === 'harley')                             return 'notes';   // Logic textbook
  return 'other';
}

// Build a human-readable title from a filename + sub-folder context
function buildTitle(filename, subFolder, courseName, pageIndex = 1) {
  const baseName = path.basename(filename, path.extname(filename));
  const lower    = baseName.toLowerCase();

  const COURSE_YEARS = {
    'Communicative English Language 1': '2022',
    'Geography': '2022',
    'Mathematics for Natural Science': '2021',
    'General Physics': '2024',
    'General Psychology': '2022',
    'Logic and Critical Thinking': ''
  };

  if (subFolder.toLowerCase() === 'exams' || subFolder.toLowerCase() === 'exam') {
    const isLogic = courseName.includes('Logic');
    const examPrefix = isLogic ? 'Final Exam' : 'Mid Exam';
    const year = COURSE_YEARS[courseName];

    if (/final/.test(lower) || /model/.test(lower)) {
      return year ? `Final Exam – ${courseName} (${year})` : `Final Exam – ${courseName}`;
    }

    if (/mid/.test(lower)) {
      return year ? `Mid Exam – ${courseName} (${year})` : `Mid Exam – ${courseName}`;
    }

    if (baseName.startsWith('photo_')) {
      return year 
        ? `${examPrefix} – ${courseName} (${year}) - Page ${pageIndex}`
        : `${examPrefix} – ${courseName} - Page ${pageIndex}`;
    }

    return year ? `${examPrefix} – ${courseName} (${year})` : `${examPrefix} – ${courseName}`;
  }

  // For non-exam files, use the original base name and append subfolder hint
  const folderLabel = {
    module: 'Module', modules: 'Module',
    ppt: 'Lecture Slides',
    worksheet: 'Worksheet', worksheets: 'Worksheet',
    teachers_guide: "Teacher's Guide",
    serway: 'Textbook (Serway)',
    harley: 'Textbook (Harley)',
  }[subFolder.toLowerCase()] || subFolder;

  return `${baseName} [${folderLabel}]`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function copyToUploads(srcPath) {
  const ext       = path.extname(srcPath);
  const safeName  = path.basename(srcPath).replace(/[^a-zA-Z0-9._\-\s]/g, '_');
  const unique    = `${Date.now()}_${safeName}`;
  const destPath  = path.join(UPLOADS_DIR, unique);
  fs.copyFileSync(srcPath, destPath);
  return unique; // just the filename stored in DB
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.pdf':  'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc':  'application/msword',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt':  'application/vnd.ms-powerpoint',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls':  'application/vnd.ms-excel',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.txt':  'text/plain',
    '.zip':  'application/zip',
  };
  return map[ext] || 'application/octet-stream';
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀  NEx Resource Seeder – Natural Science Semester 1\n');
  ensureUploadsDir();

  // 1. Find the "Freshman Natural Science" category
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', '%Natural Science%');

  if (catErr || !cats?.length) {
    console.error('❌  Could not find Freshman Natural Science category:', catErr?.message);
    process.exit(1);
  }
  const category = cats[0];
  console.log(`✅  Category: "${category.name}"  (${category.id})\n`);

  // 2. Fetch all Semester 1 courses for this category
  const { data: courses, error: courseErr } = await supabase
    .from('courses')
    .select('id, name')
    .eq('category_id', category.id)
    .eq('semester', SEMESTER);

  if (courseErr || !courses?.length) {
    console.error('❌  Could not load courses:', courseErr?.message);
    process.exit(1);
  }

  // Build name → id map
  const courseMap = {};
  courses.forEach(c => { courseMap[c.name] = c.id; });
  console.log('📚  Courses loaded:');
  courses.forEach(c => console.log(`     • ${c.name}  (${c.id})`));
  console.log();

  // 3. Fetch already-seeded file_urls to skip duplicates
  const { data: existing } = await supabase
    .from('resources')
    .select('file_url')
    .eq('category_id', category.id);

  const existingUrls = new Set((existing || []).map(r => r.file_url));
  console.log(`ℹ️   ${existingUrls.size} resource(s) already in DB — will skip duplicates.\n`);

  // 4. Walk the folder tree
  const subjectFolders = fs.readdirSync(RESOURSES_ROOT).filter(f =>
    fs.statSync(path.join(RESOURSES_ROOT, f)).isDirectory()
  );

  let inserted = 0, skipped = 0, errors = 0;

  for (const subjectFolder of subjectFolders) {
    const courseName = FOLDER_TO_COURSE[subjectFolder];
    if (!courseName) {
      console.warn(`⚠️   Unknown subject folder "${subjectFolder}" — skipping`);
      continue;
    }
    const courseId = courseMap[courseName];
    if (!courseId) {
      console.warn(`⚠️   Course "${courseName}" not found in DB — skipping`);
      continue;
    }

    const subjectPath = path.join(RESOURSES_ROOT, subjectFolder);
    const subFolders  = fs.readdirSync(subjectPath).filter(f =>
      fs.statSync(path.join(subjectPath, f)).isDirectory()
    );

    for (const subFolder of subFolders) {
      const subPath = path.join(subjectPath, subFolder);
      const files   = fs.readdirSync(subPath).filter(f =>
        fs.statSync(path.join(subPath, f)).isFile()
      );

      const type = getType(subFolder);

      for (const file of files) {
        const srcPath = path.join(subPath, file);
        const title   = buildTitle(file, subFolder, courseName);

        // Check duplicate by title + course_id (more reliable than URL after re-runs)
        const { data: dup } = await supabase
          .from('resources')
          .select('id')
          .eq('title', title)
          .eq('course_id', courseId)
          .maybeSingle();

        if (dup) {
          console.log(`  ⏭️   SKIP  [${subjectFolder}/${subFolder}] ${file}`);
          skipped++;
          continue;
        }

        // Copy file to uploads/
        let uniqueFilename;
        try {
          uniqueFilename = copyToUploads(srcPath);
        } catch (e) {
          console.error(`  ❌  COPY FAILED  ${file}:`, e.message);
          errors++;
          continue;
        }

        const stat     = fs.statSync(srcPath);
        const fileSize = parseFloat((stat.size / (1024 * 1024)).toFixed(2)); // MB
        const fileUrl  = `http://localhost:5000/uploads/${uniqueFilename}`;
        const mimeType = getMimeType(file);

        const record = {
          title,
          description: `${courseName} – ${subFolder} material (Jimma University, Freshman Natural Science, Semester 1)`,
          type,
          file_url:    fileUrl,
          file_size:   fileSize,
          category_id: category.id,
          course_id:   courseId,
          semester:    SEMESTER,
          university:  UNIVERSITY,
          uploader_id: ADMIN_ID,
          status:      'approved',
          downloads:   0,
        };

        const { error: insErr } = await supabase.from('resources').insert(record);

        if (insErr) {
          console.error(`  ❌  INSERT FAILED  ${file}:`, insErr.message);
          // Remove the copied file to keep uploads/ clean
          try { fs.unlinkSync(path.join(UPLOADS_DIR, uniqueFilename)); } catch {}
          errors++;
        } else {
          console.log(`  ✅  ${type.padEnd(10)} [${subjectFolder}/${subFolder}] ${file}`);
          inserted++;
        }

        // Small delay to avoid Supabase rate-limiting
        await new Promise(r => setTimeout(r, 30));
      }
    }
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`✅  Inserted : ${inserted}`);
  console.log(`⏭️   Skipped  : ${skipped}`);
  console.log(`❌  Errors   : ${errors}`);
  console.log('──────────────────────────────────────────');
  console.log('Done! Check http://localhost:5000/api/resources to verify.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
