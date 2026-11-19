const supabase = require('./lib/supabase');

const CATEGORIES_DATA = [
  {
    name: 'Freshman Natural Science',
    has_semesters: true,
    semesters: ['Semester 1', 'Semester 2'],
    sort_order: 1,
    courses: {
      'Semester 1': [
        'General Physics',
        'Mathematics for Natural Science',
        'Communicative English Language 1',
        'Geography',
        'Logic and Critical Thinking',
        'General Psychology',
        'Physical Fitness'
      ],
      'Semester 2': []
    }
  },
  {
    name: 'Freshman Social Science',
    has_semesters: true,
    semesters: ['Semester 1', 'Semester 2'],
    sort_order: 2,
    courses: {
      'Semester 1': [
        'General Economics',
        'Mathematics for Social Science',
        'Communicative English Language 1',
        'Geography',
        'Logic and Critical Thinking',
        'General Psychology',
        'Physical Fitness'
      ],
      'Semester 2': []
    }
  },
  { name: 'Software Engineering', has_semesters: false, semesters: [], sort_order: 3, courses: {} },
  { name: 'Computer Science', has_semesters: false, semesters: [], sort_order: 4, courses: {} },
  { name: 'Information Technology', has_semesters: false, semesters: [], sort_order: 5, courses: {} },
  { name: 'Information Science', has_semesters: false, semesters: [], sort_order: 6, courses: {} },
  { name: 'Aerospace Engineering', has_semesters: false, semesters: [], sort_order: 7, courses: {} },
  { name: 'Mechanical Engineering', has_semesters: false, semesters: [], sort_order: 8, courses: {} },
  { name: 'Civil Engineering', has_semesters: false, semesters: [], sort_order: 9, courses: {} },
  { name: 'Biomedical Engineering', has_semesters: false, semesters: [], sort_order: 10, courses: {} }
];

async function seedCategories() {
  console.log('🌱 Starting category & course seeding...');

  for (const catData of CATEGORIES_DATA) {
    // 1. Check or insert category
    let { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', catData.name)
      .maybeSingle();

    if (catErr) {
      console.error(`Error querying category "${catData.name}":`, catErr.message);
      continue;
    }

    if (!cat) {
      const { data: insertedCat, error: insertCatErr } = await supabase
        .from('categories')
        .insert({
          name: catData.name,
          has_semesters: catData.has_semesters,
          semesters: catData.semesters,
          sort_order: catData.sort_order
        })
        .select('id, name')
        .single();

      if (insertCatErr) {
        console.error(`Error inserting category "${catData.name}":`, insertCatErr.message);
        continue;
      }
      cat = insertedCat;
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      console.log(`ℹ️  Category already exists: ${cat.name}`);
    }

    // 2. Insert courses for this category if any
    if (catData.courses) {
      for (const [semesterName, courseList] of Object.entries(catData.courses)) {
        for (const courseName of courseList) {
          // Check if course already exists
          const { data: existingCourse, error: courseCheckErr } = await supabase
            .from('courses')
            .select('id')
            .eq('category_id', cat.id)
            .eq('semester', semesterName)
            .eq('name', courseName)
            .maybeSingle();

          if (courseCheckErr) {
            console.error(`Error checking course "${courseName}":`, courseCheckErr.message);
            continue;
          }

          if (!existingCourse) {
            const { error: insertCourseErr } = await supabase
              .from('courses')
              .insert({
                category_id: cat.id,
                name: courseName,
                semester: semesterName
              });

            if (insertCourseErr) {
              console.error(`Error inserting course "${courseName}":`, insertCourseErr.message);
            } else {
              console.log(`   📚 Course added: [${semesterName}] ${courseName}`);
            }
          } else {
            console.log(`   ℹ️  Course already exists: [${semesterName}] ${courseName}`);
          }
        }
      }
    }
  }

  console.log('\n🎉 Seeding finished successfully!');
  process.exit(0);
}

seedCategories().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});

