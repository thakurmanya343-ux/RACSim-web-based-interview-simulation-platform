// Predefined Skills Taxonomy (~55 high-frequency technical and managerial skills)
// Includes canonical display names and aliases for robust keyword detection

const SKILLS_TAXONOMY = [
  // AI, Data Science & Machine Learning
  { id: 'python', name: 'Python', aliases: ['python', 'python3', 'py'] },
  { id: 'machine-learning', name: 'Machine Learning', aliases: ['machine learning', 'ml', 'statistical modeling'] },
  { id: 'deep-learning', name: 'Deep Learning', aliases: ['deep learning', 'dl', 'neural networks', 'ann', 'dnn'] },
  { id: 'computer-vision', name: 'Computer Vision', aliases: ['computer vision', 'cv', 'opencv', 'object detection', 'yolo', 'image segmentation'] },
  { id: 'nlp', name: 'Natural Language Processing', aliases: ['nlp', 'natural language processing', 'text mining', 'bert', 'transformers', 'llm', 'large language models'] },
  { id: 'pytorch', name: 'PyTorch', aliases: ['pytorch', 'torch'] },
  { id: 'tensorflow', name: 'TensorFlow', aliases: ['tensorflow', 'tf', 'keras'] },
  { id: 'scikit-learn', name: 'Scikit-Learn', aliases: ['scikit-learn', 'sklearn', 'scikit learn'] },
  { id: 'pandas', name: 'Pandas', aliases: ['pandas'] },
  { id: 'numpy', name: 'NumPy', aliases: ['numpy'] },
  { id: 'data-analysis', name: 'Data Analysis', aliases: ['data analysis', 'eda', 'data analytics', 'data exploration'] },
  { id: 'data-visualization', name: 'Data Visualization', aliases: ['data visualization', 'matplotlib', 'seaborn', 'power bi', 'tableau'] },
  { id: 'mlops', name: 'MLOps', aliases: ['mlops', 'model deployment', 'mlflow', 'wandb'] },

  // Web, Frontend & UI/UX
  { id: 'react', name: 'React', aliases: ['react', 'reactjs', 'react.js'] },
  { id: 'javascript', name: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'] },
  { id: 'typescript', name: 'TypeScript', aliases: ['typescript', 'ts'] },
  { id: 'node-js', name: 'Node.js', aliases: ['node.js', 'nodejs', 'node'] },
  { id: 'express', name: 'Express', aliases: ['express', 'expressjs', 'express.js'] },
  { id: 'html5', name: 'HTML5', aliases: ['html', 'html5'] },
  { id: 'css3', name: 'CSS3', aliases: ['css', 'css3', 'scss', 'sass'] },
  { id: 'tailwind', name: 'Tailwind CSS', aliases: ['tailwind', 'tailwind css', 'tailwindcss'] },
  { id: 'nextjs', name: 'Next.js', aliases: ['next.js', 'nextjs'] },
  { id: 'redux', name: 'Redux', aliases: ['redux', 'redux toolkit', 'rtk'] },
  { id: 'rest-api', name: 'REST API', aliases: ['rest api', 'restful', 'restful apis', 'api design'] },
  { id: 'graphql', name: 'GraphQL', aliases: ['graphql', 'apollo'] },

  // Databases & Backend Systems
  { id: 'sql', name: 'SQL', aliases: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle'] },
  { id: 'mongodb', name: 'MongoDB', aliases: ['mongodb', 'mongo', 'nosql', 'mongoose'] },
  { id: 'redis', name: 'Redis', aliases: ['redis', 'caching'] },
  { id: 'microservices', name: 'Microservices', aliases: ['microservices', 'microservice architecture'] },
  { id: 'django', name: 'Django', aliases: ['django', 'django rest framework'] },
  { id: 'flask', name: 'Flask', aliases: ['flask'] },
  { id: 'fastapi', name: 'FastAPI', aliases: ['fastapi'] },

  // Programming Languages & Core Systems
  { id: 'java', name: 'Java', aliases: ['java', 'core java', 'spring', 'spring boot'] },
  { id: 'c-plus-plus', name: 'C++', aliases: ['c++', 'cpp', 'c plus plus'] },
  { id: 'c-lang', name: 'C', aliases: ['c programming', 'c language'] },
  { id: 'c-sharp', name: 'C#', aliases: ['c#', 'csharp', '.net', 'dotnet'] },
  { id: 'golang', name: 'Go', aliases: ['golang', 'go language'] },
  { id: 'rust', name: 'Rust', aliases: ['rust', 'rustlang'] },
  { id: 'dsa', name: 'Data Structures & Algorithms', aliases: ['dsa', 'data structures', 'algorithms'] },
  { id: 'system-design', name: 'System Design', aliases: ['system design', 'high level design', 'low level design', 'architecture'] },

  // DevOps & Cloud Infrastructure
  { id: 'git', name: 'Git', aliases: ['git', 'github', 'gitlab', 'version control'] },
  { id: 'docker', name: 'Docker', aliases: ['docker', 'containerization', 'containers'] },
  { id: 'kubernetes', name: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { id: 'aws', name: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'] },
  { id: 'linux', name: 'Linux', aliases: ['linux', 'unix', 'bash', 'shell scripting'] },
  { id: 'ci-cd', name: 'CI/CD', aliases: ['ci/cd', 'continuous integration', 'github actions', 'jenkins'] },

  // Managerial & Professional Skills
  { id: 'project-management', name: 'Project Management', aliases: ['project management', 'pmp', 'project delivery', 'project planning'] },
  { id: 'agile', name: 'Agile', aliases: ['agile', 'scrum', 'kanban', 'sprint planning'] },
  { id: 'communication', name: 'Communication', aliases: ['communication', 'verbal communication', 'written communication', 'stakeholder communication', 'presentation'] },
  { id: 'team-leadership', name: 'Team Leadership', aliases: ['leadership', 'team lead', 'mentoring', 'team leadership', 'people management'] },
  { id: 'problem-solving', name: 'Problem Solving', aliases: ['problem solving', 'analytical skills', 'critical thinking', 'analytical thinking'] },
  { id: 'time-management', name: 'Time Management', aliases: ['time management', 'prioritization', 'scheduling'] }
];

module.exports = { SKILLS_TAXONOMY };
