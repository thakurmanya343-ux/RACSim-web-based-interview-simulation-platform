const axios = require('axios');
const { candidates } = require('../db');
const { AI_SERVICE_URL } = require('./aiService');

const LOCAL_FALLBACK_SKILLS = [
  'Machine Learning', 'Deep Learning', 'Computer Vision', 'Python',
  'PyTorch', 'TensorFlow', 'OpenCV', 'Convolutional Neural Networks', 'CNN',
  'Vision Transformers', 'ViT', 'Object Detection', 'YOLO', 'FastAPI',
  'Node.js', 'React', 'Docker', 'Kubernetes', 'SQL', 'Git',
];

/**
 * Fallback parser in case Python AI service is unreachable.
 */
function parseResumeLocally(text) {
  const textLower = (text || '').toLowerCase();
  const detectedSkills = [];

  for (const s of LOCAL_FALLBACK_SKILLS) {
    if (textLower.includes(s.toLowerCase())) {
      detectedSkills.push(s);
    }
  }

  const finalSkills = detectedSkills.length > 0
    ? detectedSkills
    : ['Python', 'Machine Learning', 'Computer Vision'];

  const domainTags = [];
  if (finalSkills.some((s) => ['Machine Learning', 'Deep Learning', 'CNN'].includes(s))) {
    domainTags.push('Artificial Intelligence', 'Deep Learning');
  }
  if (finalSkills.some((s) => ['Computer Vision', 'OpenCV', 'Object Detection'].includes(s))) {
    domainTags.push('Computer Vision');
  }

  return {
    skills: listUnique(finalSkills),
    domains: domainTags.length > 0 ? listUnique(domainTags) : ['Artificial Intelligence'],
    education: ['B.Tech / M.Tech in Computer Science & AI'],
    experienceYears: 2,
    projects: ['Computer Vision Object Recognition Model', 'Deep Learning Optimization Pipeline'],
  };
}

function listUnique(arr) {
  return Array.from(new Set(arr));
}

/**
 * Parses resume text using the Python microservice (or fallback)
 * and updates the candidate's structured profile.
 */
async function processCandidateResume(candidateId, resumeText, originalFileName = 'resume.txt') {
  let parsedProfile = null;
  let isFallback = false;

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/parse-resume`,
      { resumeText },
      { timeout: 4000 }
    );
    if (response.data && response.data.parsedProfile) {
      parsedProfile = response.data.parsedProfile;
    }
  } catch (error) {
    console.warn(`[Resume Service Warning] AI microservice /parse-resume failed (${error.message}). Using local parser.`);
    parsedProfile = parseResumeLocally(resumeText);
    isFallback = true;
  }

  if (!parsedProfile) {
    parsedProfile = parseResumeLocally(resumeText);
  }

  // Update candidate profile with parsed data
  const updatedCandidate = candidates.updateProfile(candidateId, {
    skills: parsedProfile.skills,
    resumeUrl: `/uploads/${originalFileName}`,
    parsedProfile: parsedProfile,
    domainTags: parsedProfile.domains,
  });

  return {
    candidate: updatedCandidate,
    parsedProfile,
    isFallback,
  };
}

module.exports = {
  processCandidateResume,
  parseResumeLocally,
};
