import { buildAssessmentQuestionBank, buildAssessmentQuestionsFromBank } from './assessmentQuestionBank';

export function buildAssessmentQuestions(stateDetails, seed = 1) {
  return buildAssessmentQuestionsFromBank(stateDetails, seed);
}

export function getAssessmentQuestionBankSize(stateDetails) {
  return buildAssessmentQuestionBank(stateDetails).length;
}
