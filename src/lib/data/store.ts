/**
 * Public browser-side data gateway.
 *
 * UI code imports only this module so persistence can be replaced without
 * changing components or feature pages.
 */
export { recordAttempt } from "./client/attempts";
export { createCourse, deleteCourse, updateCourse } from "./client/courses";
export {
  addQuestions,
  deleteQuestion,
  importQuestions,
  normalizeQuestion,
  updateQuestion,
} from "./client/questions";
export { getState, openDataDirectory, useAppState } from "./client/state";
export { createTopic, deleteTopic, renameTopic } from "./client/topics";
