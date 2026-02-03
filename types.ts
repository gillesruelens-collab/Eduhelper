
export enum StudyLevel {
  YEAR_1 = '1ste middelbaar',
  YEAR_2 = '2ste middelbaar',
  YEAR_3 = '3ste middelbaar',
  YEAR_4 = '4ste middelbaar',
  YEAR_5 = '5ste middelbaar',
  YEAR_6 = '6ste middelbaar',
}

export enum FeatureType {
  SUMMARY = 'Samenvatting',
  MINDMAP = 'Mindmap',
  GLOSSARY = 'Begrippenlijst',
  FLASHCARDS = 'Steekkaarten',
  TEST = 'Kennis Test',
}

export enum TestType {
  MULTIPLE_CHOICE = 'Meerkeuze',
  OPEN_QUESTIONS = 'Open vragen',
}

export interface MindmapNode {
  name: string;
  children?: MindmapNode[];
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Question {
  id: string;
  question: string;
  type: TestType;
  options?: string[]; // For multiple choice
  correctAnswer: string;
}

export interface TestResult {
  score: number;
  maxScore: number;
  feedback: string;
  gradedQuestions: {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
    feedback: string;
  }[];
}

export interface SummarySection {
  title: string;
  content: string;
  keyPoints: string[];
  imagePrompt: string; // Used to generate a relevant educational illustration
}

export interface StructuredSummary {
  title: string;
  introduction: string;
  sections: SummarySection[];
  conclusion: string;
}
