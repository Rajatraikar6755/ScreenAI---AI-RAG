/**
 * Zustand store for interview state management.
 * Persists session data across page navigations.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ResumeData,
  Role,
  QuestionResponse,
  SessionCreateResponse,
} from "@/lib/types";

interface InterviewState {
  // Setup
  resumeData: ResumeData | null;
  selectedRole: Role | null;
  sessionResponse: SessionCreateResponse | null;

  // Interview state
  currentQuestion: QuestionResponse | null;
  questionsAsked: number;

  // Actions
  setResumeData: (data: ResumeData) => void;
  setSelectedRole: (role: Role) => void;
  setSessionResponse: (session: SessionCreateResponse) => void;
  setCurrentQuestion: (q: QuestionResponse) => void;
  incrementQuestionsAsked: () => void;
  reset: () => void;
}

const initialState = {
  resumeData: null,
  selectedRole: null,
  sessionResponse: null,
  currentQuestion: null,
  questionsAsked: 0,
};

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      ...initialState,

      setResumeData: (data) => set({ resumeData: data }),
      setSelectedRole: (role) => set({ selectedRole: role }),
      setSessionResponse: (session) => set({ sessionResponse: session }),
      setCurrentQuestion: (q) => set({ currentQuestion: q }),
      incrementQuestionsAsked: () =>
        set((s) => ({ questionsAsked: s.questionsAsked + 1 })),
      reset: () => set(initialState),
    }),
    {
      name: "interview-session",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
