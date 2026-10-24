/**
 * Public browser-side data gateway.
 *
 * UI code imports only this module so persistence can be replaced without
 * changing components or feature pages.
 */
export { recordAttempt } from "./client/attempts";
export { createCourse, deleteCourse, updateCourse } from "./client/courses";
export { createNote, deleteNote, updateNote } from "./client/notes";
export {
  createOldExam,
  deleteOldExam,
  readOldExam,
  updateOldExam,
  type OldExamInput,
} from "./client/old-exams";
export {
  addQuestions,
  deleteQuestion,
  importQuestions,
  normalizeQuestion,
  updateQuestion,
  togglePinned,
} from "./client/questions";
export {
  exportDataBackup,
  getState,
  importDataBackup,
  listRecoveryQuestions,
  restoreRecoveryQuestions,
  deleteRecoveryQuestions,
  openDataDirectory,
  useAppState,
} from "./client/state";
export { createTopic, deleteTopic, renameTopic, toggleTopicFavorite } from "./client/topics";
