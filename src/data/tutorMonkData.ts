import { CountryInfo, ExamInfo, SubjectCourse, SkillProgram, ClassSession } from '../types';

export const COUNTRIES_DATA: CountryInfo[] = [
  {
    id: 'usa',
    code: 'usa',
    name: 'USA',
    flag: '🇺🇸',
    tagline: 'K-12 tutoring, SAT & ACT prep, AP and advanced courses.',
    curriculums: ['Common Core', 'AP (Advanced Placement)', 'Next Gen Science (NGSS)', 'State Standards (NY/CA/TX)'],
    keyExams: ['SAT', 'ACT', 'AP Calculus/Physics', 'SSAT / ISEE'],
    gradesOffered: 'Kindergarten to Grade 12',
    features: ['US time-zone matched tutors', 'College Board aligned syllabus', 'Diagnostic gap identification']
  },
  {
    id: 'canada',
    code: 'canada',
    name: 'Canada',
    flag: '🇨🇦',
    tagline: 'Tutoring for Grades 1 to 12 in every core subject.',
    curriculums: ['Ontario Curriculum', 'British Columbia Curriculum', 'Alberta Program of Studies'],
    keyExams: ['OSSLT (Ontario)', 'Diploma Exams (Alberta)', 'EQAO (Grades 3, 6, 9)'],
    gradesOffered: 'Grades 1 to 12',
    features: ['Bilingual options (English & French)', 'Provincial exam readiness', 'Structured STEM milestones']
  },
  {
    id: 'uk',
    code: 'uk',
    name: 'UK',
    flag: '🇬🇧',
    tagline: 'GCSE, A Level and 11+ preparation.',
    curriculums: ['National Curriculum England', 'Scottish Highers', 'Cambridge International'],
    keyExams: ['11+ Grammar Entrance', 'GCSEs', 'A-Levels (Maths, Chemistry, Physics)'],
    gradesOffered: 'Year 1 to Year 13',
    features: ['Examiner-grade past paper drills', 'Selective school entry focus', 'Rigorous essay marking rubrics']
  },
  {
    id: 'india',
    code: 'india',
    name: 'India',
    flag: '🇮🇳',
    tagline: 'Boards 10th & 12th, IIT-JEE & NEET, Olympiads, Vedic Maths.',
    curriculums: ['CBSE', 'ICSE / ISC', 'State Boards (Maharashtra, Karnataka, etc.)'],
    keyExams: ['Class 10 & 12 Boards', 'IIT-JEE Mains & Advanced', 'NEET (Medical)', 'Maths/Science Olympiads (IMO/NSO)'],
    gradesOffered: 'Class 1 to 12 & Droppers',
    features: ['Top IIT & NIT alumnus mentors', 'Formula memory shortcuts', 'Chapter-wise test series']
  },
  {
    id: 'australia',
    code: 'australia',
    name: 'Australia',
    flag: '🇦🇺',
    tagline: 'Foundation to Year 12, NAPLAN, ICAS, HSC, VCE and QCE.',
    curriculums: ['Australian Curriculum (ACARA)', 'NSW Syllabus', 'Victorian Curriculum (VCAA)'],
    keyExams: ['NAPLAN (Years 3, 5, 7, 9)', 'ICAS Competitions', 'HSC (NSW)', 'VCE (Victoria)', 'QCE (Queensland)'],
    gradesOffered: 'Foundation to Year 12',
    features: ['AEST / AWST evening sessions', 'NAPLAN numeracy & language rubrics', 'ATAR target goal tracking']
  },
  {
    id: 'international',
    code: 'international',
    name: 'International',
    flag: '🌐',
    tagline: 'IB, IGCSE and Cambridge curriculum tutoring.',
    curriculums: ['IB Primary Years (PYP)', 'IB Middle Years (MYP)', 'IB Diploma Programme (DP)', 'Cambridge IGCSE'],
    keyExams: ['IB DP Final Exams', 'Cambridge Checkpoints', 'IGCSE Board Finals'],
    gradesOffered: 'Ages 5 to 19',
    features: ['Inquiry-based pedagogy', 'Internal Assessment (IA) guidance', 'Cross-border time zone scheduling']
  }
];

export const EXAMS_DATA: ExamInfo[] = [
  {
    id: 'ossd-ontario',
    title: 'OSSD (Ontario Secondary School Diploma)',
    country: 'Canada',
    countryCode: 'canada',
    category: 'Statutory',
    description: 'The standard secondary school diploma required for graduation in Ontario, built on a balanced mix of applied and academic courses across Grades 9-12.',
    grades: 'Grade 9 to 12',
    curriculum: 'Ontario Ministry of Education (OMOE) 2024 Curriculum',
    keyTopics: ['Grade 9/10 Academic vs Applied Math', 'Grade 11/12 Functions & Advanced Functions', 'University/College Preparation (U/M/C) Course Levels', 'Literacy & Numeracy Diagnostic (OSSLT)']
  },
  {
    id: 'osslt-ontario',
    title: 'OSSLT (Ontario Secondary School Literacy Test)',
    country: 'Canada',
    countryCode: 'canada',
    category: 'Statutory',
    description: 'A mandatory provincial literacy assessment for Ontario students. Passing is required to graduate with an OSSD.',
    grades: 'Grade 10 (and Grade 11 re-takers)',
    curriculum: 'Ontario Secondary School Literacy Test (EQAO)',
    keyTopics: ['Reading Informational & Narrative Texts', 'Writing Opinion & News Reports', 'Multi-Source Document Synthesis', 'Sentence Grammar & Mechanics']
  },
  {
    id: 'alberta-diploma',
    title: 'Alberta Diploma Exams',
    country: 'Canada',
    countryCode: 'canada',
    category: 'Statutory',
    description: 'Provincial diploma exams for Grade 12 students in Alberta, counting 50% toward the final course grade.',
    grades: 'Grade 12',
    curriculum: 'Alberta Education Diploma Exam Board',
    keyTopics: ['Math 20-1 / 20-2 Pure & Applied', 'English 30-1 / 30-2', 'Biology 30 / Chemistry 30 / Physics 30', 'External Assessment Rubrics']
  },
  {
    id: 'eqao-canada',
    title: 'EQAO Provincial Assessments (ON & National)',
    country: 'Canada',
    countryCode: 'canada',
    category: 'Statutory',
    description: 'Standardized provincial assessments used to benchmark student achievement in core numeracy and literacy across Ontario and comparable boards.',
    grades: 'Grades 3, 6, 9',
    curriculum: 'Education Quality and Accountability Office (EQAO)',
    keyTopics: ['Grade 9 Applied/Academic Math Diagnostic', 'Grade 3/6 Reading & Writing', 'Equation Solving & Proportionality', 'Data Interpretation & Probability']
  },
  {
    id: 'naplan',
    title: 'NAPLAN Exam',
    country: 'Australia',
    countryCode: 'australia',
    category: 'Statutory',
    description: 'National literacy and numeracy checks in set school years (Years 3, 5, 7, 9).',
    grades: 'Years 3, 5, 7, 9',
    curriculum: 'ACARA National Assessment',
    keyTopics: ['Reading Comprehension', 'Persuasive Writing', 'Language Conventions', 'Numeracy & Problem Solving']
  },
  {
    id: 'icas',
    title: 'ICAS Competitions',
    country: 'Australia',
    countryCode: 'australia',
    category: 'Optional',
    description: 'Skills competitions in several academic subjects, designed to stretch high performers.',
    grades: 'Year 2 to Year 12',
    curriculum: 'UNSW Global Competitions',
    keyTopics: ['Higher-Order Math Reasoning', 'Scientific Enquiry', 'Spelling & Vocabulary', 'Digital Technologies']
  },
  {
    id: 'hsc',
    title: 'HSC & Senior Secondary',
    country: 'Australia',
    countryCode: 'australia',
    category: 'Statutory',
    description: 'Final-year school certificate and state exams determining ATAR university admissions.',
    grades: 'Years 11 & 12',
    curriculum: 'NSW NESA / VCE / QCE',
    keyTopics: ['Advanced Mathematics', 'Extension 1 & 2', 'Physics & Chemistry', 'English Advanced']
  },
  {
    id: 'boards-india',
    title: 'Boards 10th & 12th',
    country: 'India',
    countryCode: 'india',
    category: 'Statutory',
    description: 'Class 10 and 12 board exam preparation with rigorous past 10-year question solving.',
    grades: 'Class 10 & 12',
    curriculum: 'CBSE / ICSE / State Boards',
    keyTopics: ['NCERT Mastery', 'Step-by-step Answer Writing', 'Calculus & Vectors', 'Chemical Reactions & Thermodynamics']
  },
  {
    id: 'iit-jee-neet',
    title: 'IIT-JEE & NEET',
    country: 'India',
    countryCode: 'india',
    category: 'Entrance',
    description: 'Entrance preparation for premier engineering and medical universities across India.',
    grades: 'Class 11, 12 & Repeater',
    curriculum: 'JEE Mains/Advanced & NEET NTA',
    keyTopics: ['Mechanics & Electrodynamics', 'Organic Chemistry Mechanisms', 'Zoology & Botany', 'Speed-Accuracy Drills']
  },
  {
    id: 'olympiads-india',
    title: 'Olympiad Preparation',
    country: 'India',
    countryCode: 'india',
    category: 'Optional',
    description: 'Practice for Maths, Science and Cyber Olympiads (IMO, NSO, SilverZone).',
    grades: 'Class 1 to 10',
    curriculum: 'SOF / SilverZone / Asset',
    keyTopics: ['Logical Reasoning', 'Achiever Section Problem Solving', 'Advanced Mental Math', 'Everyday Science Applications']
  },
  {
    id: 'sat',
    title: 'Digital SAT',
    country: 'USA',
    countryCode: 'usa',
    category: 'Entrance',
    description: 'Adaptive computer-based standardized test required for US undergraduate college applications.',
    grades: 'Grades 10, 11 & 12',
    curriculum: 'College Board Digital SAT',
    keyTopics: ['Reading & Writing Modules', 'Algebra & Advanced Math', 'Desmos Calculator Mastery', 'Timed Practice Tests']
  },
  {
    id: 'act',
    title: 'ACT Test',
    country: 'USA',
    countryCode: 'usa',
    category: 'Entrance',
    description: 'Comprehensive college entrance exam measuring English, Math, Reading, and Science reasoning.',
    grades: 'Grades 10, 11 & 12',
    curriculum: 'ACT Org',
    keyTopics: ['Science Data Interpretation', 'Plane Geometry & Trigonometry', 'Rhetorical Grammar Skills', 'Pacing Strategy']
  },
  {
    id: 'ap-exams',
    title: 'AP Exam Preparation',
    country: 'USA',
    countryCode: 'usa',
    category: 'Optional',
    description: 'College-level courses and exams for high schoolers to earn early university credits.',
    grades: 'Grades 9 to 12',
    curriculum: 'College Board AP',
    keyTopics: ['AP Calculus AB/BC', 'AP Physics 1/C', 'AP Chemistry', 'Free-Response Question (FRQ) Rubrics']
  },
  {
    id: 'gcse-uk',
    title: 'GCSE & 11+ Grammar School',
    country: 'UK',
    countryCode: 'uk',
    category: 'Statutory',
    description: 'Critical secondary education certifications and grammar school entrance exams.',
    grades: 'Year 5 to Year 11',
    curriculum: 'AQA / Edexcel / OCR',
    keyTopics: ['Verbal & Non-Verbal Reasoning', 'GCSE Foundation & Higher Tier Maths', 'Triple Science', 'Past Paper Marking']
  },
  {
    id: 'ib-diploma',
    title: 'IB Diploma Programme (DP)',
    country: 'International',
    countryCode: 'international',
    category: 'Optional',
    description: 'Rigorous two-year pre-university curriculum recognized by universities globally.',
    grades: 'Grades 11 & 12',
    curriculum: 'International Baccalaureate',
    keyTopics: ['Math Analysis & Approaches (AA)', 'Physics & Chemistry HL', 'Internal Assessment (IA) Proofing', 'Extended Essay Mentorship']
  }
];

export const SCHOOL_SUBJECTS: SubjectCourse[] = [
  {
    id: 'maths',
    title: 'Mathematics',
    iconName: 'Calculator',
    description: 'Number sense, problem solving, algebra, geometry, and real confidence with every topic.',
    colorBorder: 'border-violet-500/30',
    gradeBands: ['Grades 1-5 (Foundational)', 'Grades 6-8 (Pre-Algebra & Geometry)', 'Grades 9-12 (Calculus & Functions)'],
    highlights: ['Visual concept animations', 'Mental calculation shortcuts', 'Curriculum-mapped homework support']
  },
  {
    id: 'science',
    title: 'Science',
    iconName: 'Microscope',
    description: 'Concepts explained through real-life examples, interactive models, and quick experiments at home.',
    colorBorder: 'border-amber-500/30',
    gradeBands: ['Grades 1-5 (General Science)', 'Grades 6-8 (Integrated Sciences)', 'Grades 9-12 (Physics, Chemistry, Biology)'],
    highlights: ['Hands-on visual breakdown', 'Lab report guidance', 'Formula derivation and numerical mastery']
  },
  {
    id: 'english',
    title: 'English & Language',
    iconName: 'BookOpen',
    description: 'Reading comprehension, structured writing, vocabulary building, and grammar that grow together.',
    colorBorder: 'border-emerald-500/30',
    gradeBands: ['Grades 1-5 (Phonics & Storytelling)', 'Grades 6-8 (Grammar & Essays)', 'Grades 9-12 (Literary Analysis & Rhetoric)'],
    highlights: ['Creative writing workshops', 'Active reading techniques', 'Critical text dissection']
  },
  {
    id: 'homework-help',
    title: 'Homework Help',
    iconName: 'FileEdit',
    description: 'Daily help with school homework and project submissions so nothing is left unsolved or misunderstood.',
    colorBorder: 'border-sky-500/30',
    gradeBands: ['All Grades (1 to 12)', 'Targeted Subject Help', 'Urgent Project Guidance'],
    highlights: ['No more bedtime homework battles', 'Tutor clarifies root concepts', 'Immediate review before submission']
  }
];

export const SKILL_ACADEMY_PROGRAMS: SkillProgram[] = [
  {
    id: 'vedic-maths',
    title: 'Vedic Maths',
    iconName: 'Binary',
    description: 'Fast mental calculation tricks, speed arithmetic, and cross-multiplication methods.',
    ageGroup: 'Ages 7 to 16',
    duration: '12 Weeks (24 Sessions)',
    outcomes: ['Calculate 10x faster than traditional methods', 'Eliminate fear of large numbers', 'Ace competitive exams easily']
  },
  {
    id: 'chess',
    title: 'Chess Strategy & Mastery',
    iconName: 'Crown',
    description: 'Planning, tactical foresight, patience, and spatial focus taught by certified chess masters.',
    ageGroup: 'Ages 6 to 16',
    duration: '16 Weeks (32 Sessions)',
    outcomes: ['FIDE rated openings and endgames', 'Deep logical thinking & decision-making', 'Tournament preparation & puzzles']
  },
  {
    id: 'coding-ai',
    title: 'Coding & AI for Kids',
    iconName: 'Laptop',
    description: 'Build small games, interactive apps, and learn how AI helpers actually work.',
    ageGroup: 'Ages 8 to 17',
    duration: '16 Weeks (32 Sessions)',
    outcomes: ['Scratch, Python & Web basics', 'Understand machine learning fundamentals', 'Build and deploy a portfolio game']
  },
  {
    id: 'public-speaking',
    title: 'Public Speaking & Debate',
    iconName: 'Mic',
    description: 'Speak clearly, structure persuasive speeches, write creatively, and conquer stage anxiety.',
    ageGroup: 'Ages 8 to 17',
    duration: '10 Weeks (20 Sessions)',
    outcomes: ['Voice modulation and body language', 'Impromptu speaking frameworks', 'Debate argumentation & rebuttals']
  },
  {
    id: 'creative-writing',
    title: 'Creative Writing Masterclass',
    iconName: 'Feather',
    description: 'Crafting compelling characters, vivid worlds, and unforgettable plot twists.',
    ageGroup: 'Ages 9 to 16',
    duration: '10 Weeks (20 Sessions)',
    outcomes: ['Sensory description techniques', 'Story arc pacing & dialogue rhythm', 'Get published in student anthologies']
  },
  {
    id: 'financial-literacy',
    title: 'Financial Literacy for Teens',
    iconName: 'Coins',
    description: 'Budgeting, compound interest, stock basics, and how real-world economics operates.',
    ageGroup: 'Ages 12 to 18',
    duration: '8 Weeks (16 Sessions)',
    outcomes: ['Smart money management habits', 'Understanding investments and risk', 'Entrepreneurship project blueprint']
  }
];

export const MOCK_SESSIONS: ClassSession[] = [
  {
    id: 'sess-101',
    subject: 'Grade 8 Mathematics',
    topic: 'Linear Equations & Graphing Slopes',
    tutorName: 'Dr. Evelyn Reed (Oxford Alum)',
    studentName: 'Aarav Sharma',
    grade: 'Grade 8',
    date: 'Today',
    time: '4:30 PM - 5:30 PM',
    status: 'Upcoming',
    durationMinutes: 60,
    whiteboardNotes: 'Reviewing y = mx + b standard form, perpendicular slope relationship, and word problems.',
    homeworkAssigned: 'Complete Exercise 4.3 on slope intercept graphing (Due Oct 28).',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    whiteboardLink: 'https://excalidraw.com/#room=tutormonk-demo-math'
  },
  {
    id: 'sess-102',
    subject: 'Middle School Science',
    topic: 'Newtonian Forces & Free Body Diagrams',
    tutorName: 'Marcus Bennett (M.Sc. Physics)',
    studentName: 'Aarav Sharma',
    grade: 'Grade 8',
    date: 'Wednesday, Oct 28',
    time: '5:00 PM - 6:00 PM',
    status: 'Upcoming',
    durationMinutes: 60,
    whiteboardNotes: 'Vector resolution, friction coefficients, and inclined plane calculations.',
    homeworkAssigned: 'Phet simulation lab sheet on kinetic energy.',
    meetLink: 'https://meet.google.com/xyz-pdqr-lmn',
    whiteboardLink: 'https://excalidraw.com/#room=tutormonk-demo-science'
  },
  {
    id: 'sess-103',
    subject: 'Coding & AI',
    topic: 'Python Game Loops & Pygame Sprites',
    tutorName: 'Priya Narayanan (Software Architect)',
    studentName: 'Aarav Sharma',
    grade: 'Grade 8',
    date: 'Saturday, Oct 31',
    time: '11:00 AM - 12:00 PM',
    status: 'Upcoming',
    durationMinutes: 60,
    whiteboardLink: 'https://excalidraw.com/#room=tutormonk-demo-coding'
  }
];

export const TESTIMONIALS = [
  {
    parent: 'Sarah Jenkins',
    child: 'Liam, Grade 7',
    location: 'Sydney, Australia',
    metric: 'NAPLAN Band 8 achieved',
    text: 'Tutor Monk completely transformed Liam\'s confidence with math. The 1:1 tutor identified gaps from year 5 that were holding him back. Within 3 months, his grades jumped by two levels.'
  },
  {
    parent: 'Rajesh & Sunita Mehra',
    child: 'Ananya, Grade 10',
    location: 'New Delhi, India',
    metric: '96% in Board Mid-Terms',
    text: 'Finding a tutor who balances both CBSE board preparation and Olympiad rigor was tough until we found Tutor Monk. The weekly feedback and recorded whiteboard notes are a game changer.'
  },
  {
    parent: 'David Miller',
    child: 'Chloe, Grade 11',
    location: 'California, USA',
    metric: '+190 points on SAT Math',
    text: 'The digital SAT strategies and personalized pacing helped Chloe smash her target score of 1500. Having one dedicated educator who knows her specific weak spots made all the difference.'
  }
];

export const SAMPLE_DIAGNOSTIC_QUESTIONS = [
  {
    id: 'q1',
    subject: 'Maths (Grade 6-8)',
    question: 'If 3x + 7 = 28, what is the value of 2x - 3?',
    options: ['11', '14', '7', '9'],
    correctIndex: 0,
    explanation: 'Subtract 7 from both sides: 3x = 21, so x = 7. Then evaluate 2(7) - 3 = 14 - 3 = 11.'
  },
  {
    id: 'q2',
    subject: 'Science (Physics Concept)',
    question: 'When a roller coaster descends from the top of a hill, which energy conversion primarily occurs?',
    options: [
      'Kinetic energy converts to potential energy',
      'Gravitational potential energy converts to kinetic energy',
      'Thermal energy converts into chemical energy',
      'Electric energy converts into magnetic force'
    ],
    correctIndex: 1,
    explanation: 'At the crest, the car has maximum gravitational potential energy. As it descends, this converts directly into kinetic energy (speed).'
  },
  {
    id: 'q3',
    subject: 'Vedic Math Shortcut',
    question: 'Using Vedic Nikhilam sutra, what is 97 × 96?',
    options: ['9312', '9212', '9412', '9112'],
    correctIndex: 0,
    explanation: 'Deficiencies from 100: -3 and -4. Left part: 97 - 4 = 93. Right part: (-3) × (-4) = 12. Result: 9312!'
  }
];
