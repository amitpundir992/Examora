import type { AnswerMap, AttemptResult, Exam } from "./types";

export function gradeAttempt(exam: Exam, answers: AnswerMap, timeSpentSec: number): AttemptResult {
  const perQuestion = exam.questions.map((question) => {
    const selectedIndex = question.id in answers ? answers[question.id] : null;
    return {
      questionId: question.id,
      selectedIndex,
      correctIndex: question.correctIndex,
      isCorrect: selectedIndex === question.correctIndex,
    };
  });
  const correct = perQuestion.filter((answer) => answer.isCorrect).length;
  const answered = perQuestion.filter((answer) => answer.selectedIndex != null).length;
  const total = exam.questions.length;

  return {
    examId: exam.id,
    total,
    correct,
    wrong: answered - correct,
    unanswered: total - answered,
    percentage: total ? Math.round((correct / total) * 100) : 0,
    timeSpentSec,
    perQuestion,
  };
}
