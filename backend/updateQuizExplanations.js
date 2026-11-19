const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const explanationsMap = {
  "You need a quiet place to study. Where ___ go?": 
    "In question form, the modal auxiliary precedes the subject: 'Where should I go?'. 'I should' is a statement word order, while 'ought' requires 'to' (e.g., 'ought I to go').",

  "You ___ talk to your teacher if you think the mark is wrong.": 
    "'Ought to' is the standard modal phrase used to express moral obligation or advice. 'Ought' without 'to' is incomplete, 'should to' is ungrammatical (should takes bare infinitive), and 'had better' takes a bare infinitive without 'to'.",

  "It is raining. You had better ___ an umbrella.": 
    "'Had better' is an idiomatic modal phrase expressing strong advice/warning and is always followed by the bare infinitive (base form of the verb: 'bring'), without 'to'.",

  "After Larry ___ the film on TV, he decided to buy the book.": 
    "When two past actions occur sequentially, the past perfect ('had seen') expresses the earlier completed event that happened before the subsequent past simple action ('decided').",

  "Choose the correct population collocation.": 
    "In standard English, the established academic collocation describing a high concentration of people per unit area is 'dense population' (or sparsely populated for low density).",

  "She ___ three books so far.": 
    "'So far' indicates an unfinished time period connecting the past to the present, requiring the present perfect tense with the singular subject 'She': 'has read'.",

  "They ___ in Addis Ababa since 2022.": 
    "'Since' marks the starting point of an action that began in the past and continues to the present moment, requiring the present perfect tense ('have lived').",

  "Which sentence gives advice correctly?": 
    "The modal verb 'should' is followed directly by the bare infinitive ('revise'). It does not take 'to' or gerund/past forms.",

  "Which expression can give stronger advice?": 
    "'Had better' conveys stronger advice than 'should' or 'ought to', often carrying an implied warning or consequence if the advice is not followed.",

  "Which structure forms the present perfect?": 
    "The present perfect tense is constructed using the auxiliary verb 'have' or 'has' (depending on the subject) followed by the past participle (V3) of the main verb.",

  "I ___ my assignment already.": 
    "The adverb 'already' commonly accompanies the present perfect tense ('have finished') to signal that an action was completed prior to the present moment.",

  "How long ___ you ___ a student here?": 
    "To ask about the duration of an ongoing state that started in the past and extends to the present, we use the present perfect interrogative form: 'have you been'.",

  "If I meet her, I ___ her the news.": 
    "This is a First Conditional sentence (real/likely future condition). The structure is: If + present simple ('meet'), will + base verb ('will tell').",

  "Choose the correct negative form.": 
    "The negative of 'had better' is formed by placing 'not' directly after 'better' followed by the base verb: 'You had better not stay up late.'",

  "Which pattern is the first conditional?": 
    "The First Conditional expresses real or probable future possibilities using the pattern: 'If + present simple, will + base verb'.",

  "If I ___ more time, I would learn another language.": 
    "This is a Second Conditional sentence (hypothetical present/future situation). The if-clause takes the past simple ('had') paired with 'would + base verb' in the main clause.",

  "Choose the correct second conditional sentence.": 
    "The Second Conditional uses the pattern 'If + past simple, would + base verb'. 'If I saw him, I would call him' correctly follows this hypothetical rule.",

  "If they had left earlier, they ___ the bus.": 
    "This is a Third Conditional sentence (unreal past condition). The structure is: If + past perfect ('had left'), would have + past participle ('would have caught').",

  "If it rains tomorrow, we ___ at home.": 
    "First conditional rule: If + present simple ('rains'), main clause uses 'will + base verb' ('will stay') to state the predicted result.",

  "If you had called me, I ___ you.": 
    "Third conditional rule: If + past perfect ('had called'), main clause uses 'would have + past participle' ('would have helped') for an imagined past result.",

  "Water ___ at 100°C under standard atmospheric pressure.": 
    "Scientific truths, general laws, and universal facts are expressed using the present simple tense with third-person singular agreement: 'boils'.",

  "Yesterday, we ___ the lecture.": 
    "The specific past time marker 'yesterday' requires the past simple tense ('attended') for a completed action.",

  "By the time the class started, the teacher ___ the materials.": 
    "'By the time' followed by the past simple indicates a deadline in the past; the action completed before that deadline must be in the past perfect ('had prepared').",

  "She ___ many awards for her contribution.": 
    "The present perfect ('has won') is used for life experiences and achievements when no specific past time is mentioned.",

  "He usually ___ to campus by bus.": 
    "The frequency adverb 'usually' signals a habitual action, which takes the present simple tense with third-person singular suffix '-s/-es': 'goes'.",

  "Which phrase means the number of people living in a particular area?": 
    "'Population density' is the precise geographical and demographic term for the measurement of population per unit area.",

  "Choose the correct active-voice sentence.": 
    "In active voice, the subject performs the action directly: 'Hana' (subject) + 'wrote' (transitive verb) + 'the report' (direct object).",

  "Choose the correct passive form of 'The students clean the classroom.'": 
    "In present simple passive, the object becomes the subject, followed by 'is/are + past participle': 'The classroom is cleaned by the students.'",

  "Choose the correct passive form of 'They built the bridge in 2010.'": 
    "In past simple passive, singular objects take 'was + past participle': 'The bridge was built in 2010.'",

  "Which formula generally forms the passive voice?": 
    "All passive voice structures are fundamentally formed by an appropriate tense form of the auxiliary verb 'be' followed by the past participle (V3) of the main verb.",

  "Change to passive: 'The researchers study wildlife.'": 
    "'Wildlife' is an uncountable singular noun, so in the present simple passive it takes 'is + studied': 'Wildlife is studied by the researchers.'",

  "Change to active: 'The national park was visited by many tourists.'": 
    "In active voice, the agent ('many tourists') becomes the subject performing the action: 'Many tourists visited the national park.'",

  "Choose the correct passive form: 'Someone has stolen my bag.'": 
    "Present perfect passive is formed using 'has/have been + past participle': 'My bag has been stolen.'",

  "Which sentence is in the passive voice?": 
    "'The forest is protected by the community' uses the passive structure 'be (is) + past participle (protected) + by agent'.",

  "Choose the correct form: 'The results ___ tomorrow.'": 
    "Future passive with 'tomorrow' is formed with 'will be + past participle': 'will be announced'.",

  "The word's dictionary or literal meaning is its ___ meaning.": 
    "Denotation refers to the explicit, primary, or literal dictionary definition of a word, as opposed to its associated emotional nuances.",

  "The feelings or associations connected with a word are its ___ meaning.": 
    "Connotation refers to the cultural, emotional, or secondary associations and feelings that a word evokes beyond its literal meaning.",

  "Which word often has a more negative connotation than 'group'?": 
    "While 'group' is neutral, 'clique' carries an exclusive, unwelcoming, and snobbish negative connotation.",

  "Choose the correct sentence using 'ought to'.": 
    "'Ought to' is followed by a bare verb: 'You ought to study more.' It does not take 'should', gerunds, or additional prepositions.",

  "Which sentence correctly uses the present perfect?": 
    "'Mina has visited Hawassa twice' correctly uses 'has + past participle' to state an indefinite past experiential occurrence.",

  "Which sentence describes a habit?": 
    "The present simple tense ('She studies every evening') paired with a time expression indicates a regular habitual routine.",

  "If I were you, I ___ my notes every day.": 
    "The subjunctive advice structure 'If I were you' is followed by 'would + base verb': 'I would review my notes every day.'",

  "By the time I arrived, the film ___.": 
    "The action of the film starting was completed prior to the past event of arriving, requiring the past perfect: 'had started'.",

  "Which sentence correctly combines a modal with a base verb?": 
    "Modal auxiliaries like 'should' take the bare infinitive without 'to': 'Students should take notes.'",

  "Choose the correct passive form: 'Farmers grow coffee in this region.'": 
    "Coffee is an uncountable noun in the present simple tense, taking 'is + grown': 'Coffee is grown in this region.'"
};

async function updateExplanations() {
  console.log('Fetching questions with generic explanations...');
  const { data: questions, error } = await supabase
    .from('quiz_questions')
    .select('id, question_text, explanation')
    .ilike('explanation', '%The correct answer according to the module%');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`Found ${questions.length} questions to update.`);
  let updatedCount = 0;

  for (const q of questions) {
    const trimmedQ = q.question_text.trim();
    const newExplanation = explanationsMap[trimmedQ];

    if (newExplanation) {
      const { error: updateErr } = await supabase
        .from('quiz_questions')
        .update({ explanation: newExplanation })
        .eq('id', q.id);

      if (updateErr) {
        console.error(`Failed to update question ${q.id}:`, updateErr);
      } else {
        updatedCount++;
      }
    } else {
      console.warn(`No match found in map for: "${trimmedQ}"`);
    }
  }

  console.log(`Successfully updated ${updatedCount} out of ${questions.length} questions!`);

  // Verify whether any remaining 'according to' remain
  const { count } = await supabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .ilike('explanation', '%according to the module%');

  console.log('Remaining questions with "according to the module":', count);
}

updateExplanations();

