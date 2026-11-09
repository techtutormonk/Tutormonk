export type NavTab = 
  | 'home' 
  | 'countries' 
  | 'school' 
  | 'exams' 
  | 'skills' 
  | 'how-it-works' 
  | 'portal';

export type PortalRole = 'student' | 'tutor' | 'admin';

export type CountryCode = 'all' | 'usa' | 'canada' | 'uk' | 'india' | 'australia' | 'international';

export interface CountryInfo {
  id: string;
  code: CountryCode;
  name: string;
  flag: string;
  tagline: string;
  curriculums: string[];
  keyExams: string[];
  gradesOffered: string;
  features: string[];
}

export interface ExamInfo {
  id: string;
  title: string;
  country: string;
  countryCode: CountryCode;
  category: 'Statutory' | 'Optional' | 'Competitive' | 'Entrance';
  description: string;
  grades: string;
  curriculum: string;
  keyTopics: string[];
}

export interface SubjectCourse {
  id: string;
  title: string;
  iconName: string;
  description: string;
  colorBorder: string;
  gradeBands: string[];
  highlights: string[];
}

export interface SkillProgram {
  id: string;
  title: string;
  iconName: string;
  description: string;
  ageGroup: string;
  duration: string;
  outcomes: string[];
}

export interface DemoBooking {
  id: string;
  parentName: string;
  studentName: string;
  grade: string;
  country: string;
  subject: string;
  preferredDate: string;
  preferredTime: string;
  phone: string;
  email: string;
  status: 'Pending' | 'Confirmed' | 'Completed';
  createdAt: string;
}

export interface ClassSession {
  id: string;
  subject: string;
  topic: string;
  tutorName: string;
  studentName: string;
  grade: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Live Now' | 'Completed';
  durationMinutes: number;
  whiteboardNotes?: string;
  homeworkAssigned?: string;
  meetLink?: string;
  whiteboardLink?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  transcriptText?: string;
}
