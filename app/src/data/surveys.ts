/** DRAFT survey items, adapted from Ki et al. (pre/post) and Hoffman et al. (2019). Edit freely. */
import type { Question } from '../components/Survey';

export const preSurvey: Question[] = [
  { id: 'occupation', type: 'text', label: 'What is your occupation? (If you are a student, what are you studying?)' },
  {
    id: 'age_range',
    type: 'choice',
    label: 'What is your age?',
    options: ['18–24', '25–34', '35–44', '45–54', '55 or older', 'Prefer not to say'],
  },
  { id: 'first_language', type: 'text', label: 'What is your first language?' },
  {
    id: 'korean_proficiency',
    type: 'choice',
    label: 'How well can you read Korean?',
    options: ['Not at all', 'I recognize some characters', 'Basic', 'Intermediate', 'Fluent / native'],
  },
  {
    id: 'other_languages',
    type: 'text',
    label: 'Do you speak any other languages at an advanced level or above? If so, which ones?',
    optional: true,
  },
  {
    id: 'mt_frequency',
    type: 'choice',
    label: 'How often do you use machine translation tools (e.g., Google Translate, DeepL, ChatGPT)?',
    options: ['Never', 'Less than monthly', 'Monthly', 'Weekly', 'Daily'],
  },
  {
    id: 'mt_contexts',
    type: 'multi',
    label: 'In which situations have you used machine translation?',
    options: ['Travel', 'Reading websites / news', 'Messaging people', 'Work or study', 'Medical or legal documents', 'Other'],
    optional: true,
  },
  { id: 'mt_trust', type: 'likert', label: 'In general, how much do you trust machine translation?', low: 'Not at all', high: 'Completely' },
  {
    id: 'mt_check_methods',
    type: 'text',
    long: true,
    label:
      "When you're not sure whether a machine translation is correct, what do you do to check it? (If you usually don't check, say so.)",
  },
];

export const postSurvey: Question[] = [
  { id: 'mental_burden', type: 'likert', label: 'How mentally demanding was it to use the explanations?', low: 'Very low', high: 'Very high' },
  { id: 'helpfulness', type: 'likert', label: 'Overall, how helpful were the explanations for judging the translations?', low: 'Not at all', high: 'Extremely' },
  { id: 'future_trust', type: 'likert', label: 'If a translation tool showed these explanations, how much would you trust it in the future?', low: 'Not at all', high: 'Completely' },
  { id: 'most_useful', type: 'text', long: true, label: 'Which kind of explanation was most useful to you, and why?' },
  { id: 'missing', type: 'text', long: true, label: 'What information was missing that would have helped you decide?' },
  {
    id: 'mt_issue',
    type: 'text',
    long: true,
    label: 'Outside this study, has machine translation ever given you a wrong or misleading result? If so, describe what happened.',
    optional: true,
  },
  { id: 'stakes', type: 'text', long: true, label: 'Did you find yourself judging the translations or using the explanations differently for the pharmacy notices than for the hotel notices? If so, how?' },
];
