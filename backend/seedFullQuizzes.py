"""
seedFullQuizzes.py

Parses all docx question banks in quiz-questions/Natural/ and seeds
chapters into Supabase PostgreSQL for interactive quiz mode.
"""

import os
import re
import glob
import json
import zipfile
import xml.etree.ElementTree as ET
import urllib.request
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

def get_docx_text(path):
    with zipfile.ZipFile(path) as z:
        xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    paragraphs = []
    for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        text = ''.join(node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
        if text.strip():
            paragraphs.append(text.strip())
    return paragraphs

def supabase_get(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def supabase_post(endpoint, data):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def supabase_delete(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, method="DELETE", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read()
    except Exception as e:
        print("Delete error:", e)

# 1. Parse Standard Chaptered Docx (Psychology, Geography, Logic, Mathematics)
def parse_standard_docx(path):
    paras = get_docx_text(path)
    chapters = []
    current_chapter = None
    current_q = None

    for p in paras:
        # Detect Chapter Header
        chap_match = re.match(r'^(?:(?:\d+\.|\b)\s*)?(CHAPTER\s+\d+[\s:—–-]+.+)', p, re.IGNORECASE)
        if chap_match and not p.startswith('Q') and 'question' not in p.lower() and not p.startswith(('Easy', 'Medium', 'Hard')):
            current_chapter = {'title': chap_match.group(1).strip(), 'questions': []}
            chapters.append(current_chapter)
            continue

        # Detect Question
        q_match = re.match(r'^(?:Q\d+|\d+)[\.\s]+(.+)', p)
        if q_match and current_chapter is not None and not p.startswith(('A.', 'B.', 'C.', 'D.', 'Correct', 'Explanation')):
            current_q = {
                'text': q_match.group(1).strip(),
                'options': [],
                'correct': None,
                'explanation': ''
            }
            current_chapter['questions'].append(current_q)
            continue

        if current_q:
            opt_match = re.match(r'^([A-D])[\.\s]+(.+)', p)
            if opt_match:
                current_q['options'].append(opt_match.group(2).strip())
                continue
            ans_match = re.match(r'^(?:Correct answer|Answer)[\s:]+([A-D])', p, re.IGNORECASE)
            if ans_match:
                letter = ans_match.group(1).upper()
                current_q['correct'] = ord(letter) - ord('A')
                continue
            exp_match = re.match(r'^Explanation[\s\.:]+(.+)', p, re.IGNORECASE)
            if exp_match:
                current_q['explanation'] = exp_match.group(1).strip()
                continue

    # Filter chapters with valid 4-option questions
    cleaned = []
    for c in chapters:
        valid_qs = [q for q in c['questions'] if len(q['options']) == 4 and q['correct'] is not None]
        if len(valid_qs) > 0:
            cleaned.append({
                'title': c['title'],
                'questions': valid_qs
            })
    return cleaned

# 2. Parse Physics Docx (has Easy 1., Medium 1., Hard 1.)
def parse_physics_docx(path):
    paras = get_docx_text(path)
    chapters = []
    current_chapter = None
    current_q = None

    for p in paras:
        chap_match = re.match(r'^(Chapter\s+\d+\s*[—–-]\s*[^\d—–\n]+)$', p, re.IGNORECASE)
        if chap_match and 'question' not in p.lower():
            current_chapter = {'title': chap_match.group(1).strip(), 'questions': []}
            chapters.append(current_chapter)
            continue

        q_match = re.match(r'^(?:Easy|Medium|Hard)\s*\d+[\.\s]+(.+)', p)
        if q_match and current_chapter is not None:
            current_q = {
                'text': q_match.group(1).strip(),
                'options': [],
                'correct': None,
                'explanation': ''
            }
            current_chapter['questions'].append(current_q)
            continue

        if current_q:
            opt_match = re.match(r'^([A-D])[\.\s]+(.+)', p)
            if opt_match:
                current_q['options'].append(opt_match.group(2).strip())
                continue
            ans_match = re.match(r'^Correct answer[\s:]+([A-D])', p, re.IGNORECASE)
            if ans_match:
                letter = ans_match.group(1).upper()
                current_q['correct'] = ord(letter) - ord('A')
                continue
            exp_match = re.match(r'^Explanation[\s\.:]+(.+)', p, re.IGNORECASE)
            if exp_match:
                current_q['explanation'] = exp_match.group(1).strip()
                continue

    cleaned = []
    for c in chapters:
        valid_qs = [q for q in c['questions'] if len(q['options']) == 4 and q['correct'] is not None]
        if len(valid_qs) > 0:
            cleaned.append({
                'title': c['title'],
                'questions': valid_qs
            })
    return cleaned

# 3. Parse English Docx (Single Quiz with 45 Questions, Answer Key at end)
def parse_english_docx(path):
    paras = get_docx_text(path)
    ans_start = -1
    for i, p in enumerate(paras):
        if 'Answer Key' in p:
            ans_start = i
            break

    answer_map = {}
    if ans_start != -1:
        for p in paras[ans_start+1:]:
            m = re.match(r'^(\d+)[\.\s]+([A-D])', p)
            if m:
                answer_map[int(m.group(1))] = ord(m.group(2).upper()) - ord('A')

    questions = []
    current_q = None

    for p in paras[:ans_start]:
        q_match = re.match(r'^(\d+)[\.\s]+(.+)', p)
        if q_match and not p.startswith('45 Multiple-Choice'):
            q_num = int(q_match.group(1))
            current_q = {
                'text': q_match.group(2).strip(),
                'options': [],
                'correct': answer_map.get(q_num, 0),
                'explanation': f"The correct answer according to the module grammar key is option {chr(65 + answer_map.get(q_num, 0))}."
            }
            questions.append(current_q)
            continue

        if current_q:
            opt_match = re.match(r'^([A-D])[\.\s]+(.+)', p)
            if opt_match:
                current_q['options'].append(opt_match.group(2).strip())

    valid_qs = [q for q in questions if len(q['options']) == 4]
    return [{
        'title': 'Comprehensive Grammar & Language Skills (45 Questions)',
        'description': '45 multiple choice questions covering tenses, conditionals, active/passive voice, advice modals, and collocations.',
        'questions': valid_qs
    }]

def main():
    print("🚀 Seeding Chapter-by-Chapter Quizzes into Supabase...\n")

    # Fetch courses
    courses = supabase_get("courses?select=id,name")

    FILE_CONFIGS = [
        {
            'course': 'Communicative English Language 1',
            'file': '../quiz-questions/Natural/English_Grammar_45_Questions_and_Answers.docx',
            'parser': parse_english_docx
        },
        {
            'course': 'General Physics',
            'file': '../quiz-questions/Natural/General_Physics_MCQ_Question_Bank.docx',
            'parser': parse_physics_docx
        },
        {
            'course': 'General Psychology',
            'file': '../quiz-questions/Natural/General_Psychology_Comprehensive_MCQ_Bank.docx',
            'parser': parse_standard_docx
        },
        {
            'course': 'Geography',
            'file': '../quiz-questions/Natural/Geography_Ethiopia_and_the_Horn_MCQ_Question_Bank.docx',
            'parser': parse_standard_docx
        },
        {
            'course': 'Logic and Critical Thinking',
            'file': '../quiz-questions/Natural/Logic_and_Critical_Thinking_180_MCQ_Explained.docx',
            'parser': parse_standard_docx
        },
        {
            'course': 'Mathematics for Natural Science',
            'file': '../quiz-questions/Natural/Mathematics_Natural_Sciences_MCQ_Question_Bank.docx',
            'parser': parse_standard_docx
        }
    ]

    total_quizzes = 0
    total_questions = 0

    for cfg in FILE_CONFIGS:
        course_name = cfg['course']
        target_course_ids = [c['id'] for c in courses if c['name'].lower() == course_name.lower()]

        if not target_course_ids:
            print(f"⚠️ Course '{course_name}' not found in DB! Skipping.")
            continue

        print(f"\n📂 Processing {course_name} (linking to {len(target_course_ids)} course records)...")
        parsed_chapters = cfg['parser'](cfg['file'])
        print(f"   Found {len(parsed_chapters)} chapters/quizzes.")

        for course_id in target_course_ids:
            # Clear existing quizzes for this course
            supabase_delete(f"quizzes?course_id=eq.{course_id}")

            for chap in parsed_chapters:
                title = chap['title']
                desc = chap.get('description', f"Interactive practice test for {title} with explained answers.")
                questions = chap['questions']

                # Insert Quiz
                quiz_records = supabase_post("quizzes", {
                    "course_id": course_id,
                    "title": title,
                    "description": desc
                })
                if not quiz_records:
                    continue

                quiz_id = quiz_records[0]['id']
                total_quizzes += 1

                # Prepare question records
                q_records = []
                for q in questions:
                    q_records.append({
                        "quiz_id": quiz_id,
                        "question_text": q['text'],
                        "options": q['options'],
                        "correct_answer_index": q['correct'],
                        "explanation": q.get('explanation') or ""
                    })

                if q_records:
                    chunk_size = 50
                    for i in range(0, len(q_records), chunk_size):
                        chunk = q_records[i:i+chunk_size]
                        supabase_post("quiz_questions", chunk)
                    total_questions += len(q_records)
                    print(f"   ✅ [Course {course_id[:8]}] Created: {title} ({len(q_records)} Qs)")

    print(f"\n🎉 Done! Seeded {total_quizzes} Quizzes with {total_questions} total questions into Supabase PostgreSQL!")

if __name__ == '__main__':
    main()
