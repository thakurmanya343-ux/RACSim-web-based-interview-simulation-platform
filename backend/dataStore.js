// In-memory data store with seed vacancies for the demo

const vacancies = [
  {
    id: 'vac-1',
    title: 'Senior AI / Computer Vision Engineer',
    domain: 'AI / Machine Learning',
    level: 'Senior',
    experienceRequired: '3-6 years',
    location: 'Bangalore / Remote',
    salaryRange: '₹22,00,000 - ₹34,00,000 / yr',
    description: 'Lead development of next-generation visual perception and real-time inference models using PyTorch, OpenCV, and deep learning architectures.',
    requiredSkills: [
      'Python',
      'Computer Vision',
      'Deep Learning',
      'Machine Learning',
      'PyTorch',
      'TensorFlow',
      'Docker'
    ]
  },
  {
    id: 'vac-2',
    title: 'Full Stack React & Node.js Developer',
    domain: 'Web Development',
    level: 'Mid-Senior',
    experienceRequired: '2-4 years',
    location: 'Mumbai / Hybrid',
    salaryRange: '₹14,00,000 - ₹20,00,000 / yr',
    description: 'Architect dynamic frontends and microservices backends for real-time collaborative recruiting simulation software.',
    requiredSkills: [
      'React',
      'Node.js',
      'Express',
      'JavaScript',
      'TypeScript',
      'SQL',
      'REST API',
      'Tailwind CSS'
    ]
  },
  {
    id: 'vac-3',
    title: 'Lead Data Analyst & BI Specialist',
    domain: 'Data Analysis',
    level: 'Mid-Level',
    experienceRequired: '2-5 years',
    location: 'Delhi NCR / Hybrid',
    salaryRange: '₹12,00,000 - ₹18,00,000 / yr',
    description: 'Turn complex behavioral and interview evaluation logs into clear actionable executive dashboards, metric pipelines, and statistical summaries.',
    requiredSkills: [
      'Python',
      'Data Analysis',
      'SQL',
      'Pandas',
      'NumPy',
      'Data Visualization',
      'Communication',
      'Problem Solving'
    ]
  },
  {
    id: 'vac-4',
    title: 'Technical Project & Agile Delivery Manager',
    domain: 'Project Management',
    level: 'Lead / Manager',
    experienceRequired: '5-8 years',
    location: 'Pune / Remote',
    salaryRange: '₹24,00,000 - ₹32,00,000 / yr',
    description: 'Drive multi-disciplinary engineering initiatives, manage sprint roadmaps, facilitate selector panel coordination, and ensure high-integrity delivery.',
    requiredSkills: [
      'Project Management',
      'Agile',
      'Communication',
      'Team Leadership',
      'Problem Solving',
      'Time Management',
      'System Design'
    ]
  },
  {
    id: 'vac-5',
    title: 'Junior Machine Learning & Data Associate',
    domain: 'AI / Machine Learning',
    level: 'Entry-Level',
    experienceRequired: '0-2 years',
    location: 'Remote',
    salaryRange: '₹7,00,000 - ₹11,00,000 / yr',
    description: 'Assist the core algorithmic team in data preprocessing, feature engineering, exploratory analysis, and prompt validation pipelines.',
    requiredSkills: [
      'Python',
      'Machine Learning',
      'Scikit-Learn',
      'Pandas',
      'SQL',
      'Communication',
      'Git'
    ]
  }
];

// Candidates store
const candidates = [
  {
    id: 'cand-demo-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    extractedSkills: ['Python', 'Machine Learning', 'Computer Vision', 'Deep Learning', 'PyTorch', 'Git'],
    cvFileRef: '/uploads/sample_resume_ai.pdf',
    originalFileName: 'Aarav_Sharma_CV.pdf',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'cand-demo-2',
    name: 'Priya Iyer',
    email: 'priya.iyer@example.com',
    extractedSkills: ['React', 'Node.js', 'Express', 'JavaScript', 'SQL', 'REST API', 'Tailwind CSS'],
    cvFileRef: '/uploads/sample_resume_web.docx',
    originalFileName: 'Priya_Iyer_Resume.docx',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'cand-demo-3',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    extractedSkills: ['Project Management', 'Agile', 'Communication', 'Team Leadership', 'Time Management'],
    cvFileRef: '/uploads/sample_resume_pm.pdf',
    originalFileName: 'Rohan_Mehta_CV.pdf',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

// Applications store
const applications = [
  {
    id: 'app-demo-1',
    candidateId: 'cand-demo-1',
    vacancyId: 'vac-1',
    matchScore: 88,
    status: 'Interview Scheduled',
    cvFileRef: '/uploads/sample_resume_ai.pdf',
    appliedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    scheduledAt: new Date(Date.now() + 3600000 * 48).toISOString() // 2 days in future
  },
  {
    id: 'app-demo-2',
    candidateId: 'cand-demo-2',
    vacancyId: 'vac-2',
    matchScore: 92,
    status: 'Pending Schedule',
    cvFileRef: '/uploads/sample_resume_web.docx',
    appliedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    scheduledAt: null
  },
  {
    id: 'app-demo-3',
    candidateId: 'cand-demo-3',
    vacancyId: 'vac-4',
    matchScore: 85,
    status: 'Pending Schedule',
    cvFileRef: '/uploads/sample_resume_pm.pdf',
    appliedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    scheduledAt: null
  }
];

module.exports = {
  vacancies,
  candidates,
  applications
};
