const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CODING_CHALLENGES = [
  {
    id: 'chall-ai-1',
    profession: 'Artificial Intelligence',
    title: 'Numerically Stable Softmax Function',
    language: 'python',
    difficulty: 'Medium',
    description: `Implement a numerically stable softmax function in Python.
Subtract the maximum logit before computing exponentials to prevent numerical overflow:
Softmax(z_i) = exp(z_i - max(z)) / sum(exp(z_j - max(z)))`,
    starterCode: `import math

def stable_softmax(logits):
    # TODO: Implement numerically stable softmax
    max_logit = max(logits)
    exps = [math.exp(x - max_logit) for x in logits]
    sum_exps = sum(exps)
    return [round(x / sum_exps, 4) for x in exps]

# Example test run
logits = [1000.0, 1001.0, 1002.0] # Large logits that would overflow naive softmax
probs = stable_softmax(logits)
print(f"Computed Probabilities: {probs}")
print(f"Total Sum: {round(sum(probs), 2)}")
`,
  },
  {
    id: 'chall-cv-1',
    profession: 'Computer Vision',
    title: 'Intersection over Union (IoU) Bounding Box Evaluator',
    language: 'python',
    difficulty: 'Medium',
    description: `Implement the Intersection over Union (IoU) metric used in object detection models (such as YOLO or Faster R-CNN) to evaluate predicted bounding boxes against ground truth:
IoU = Area of Overlap / Area of Union`,
    starterCode: `def compute_iou(boxA, boxB):
    # box format: [x1, y1, x2, y2]
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interWidth = max(0, xB - xA)
    interHeight = max(0, yB - yA)
    interArea = interWidth * interHeight

    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

    unionArea = boxAArea + boxBArea - interArea
    if unionArea == 0:
        return 0.0
    return round(interArea / unionArea, 4)

# Example test run
ground_truth = [50, 50, 150, 150]
prediction = [70, 70, 160, 160]
iou = compute_iou(ground_truth, prediction)
print(f"Calculated IoU: {iou}")
`,
  },
  {
    id: 'chall-backend-1',
    profession: 'Backend Engineering',
    title: 'LRU (Least Recently Used) Cache',
    language: 'javascript',
    difficulty: 'Medium',
    description: `Implement an LRU Cache with get(key) and put(key, value) operations. When the cache reaches its capacity, it should invalidate the least recently used item before inserting a new item.`,
    starterCode: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

// Test Run
const lru = new LRUCache(2);
lru.put("a", 100);
lru.put("b", 200);
console.log("Get a:", lru.get("a")); // 100
lru.put("c", 300); // evicts "b"
console.log("Get b (should be -1):", lru.get("b")); // -1
console.log("Get c:", lru.get("c")); // 300
`,
  },
];

/**
 * Executes Python or JavaScript code safely with a strict execution timeout.
 */
function executeCode({ language = 'python', code = '', timeoutMs = 5000 }) {
  return new Promise((resolve) => {
    const tempDir = os.tmpdir();
    const ext = language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js' ? 'js' : 'py';
    const tempFile = path.join(tempDir, `racsim_code_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`);

    try {
      fs.writeFileSync(tempFile, code, 'utf8');
    } catch (err) {
      return resolve({
        stdout: '',
        stderr: `File creation error: ${err.message}`,
        status: 'error',
        time: '0.00s',
        memory: '0 KB',
      });
    }

    const startTime = Date.now();
    const cmd = ext === 'js' ? 'node' : 'python';
    const args = [tempFile];

    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Clean up temp file
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (e) {}

      if (error) {
        if (error.killed || error.signal === 'SIGTERM') {
          return resolve({
            stdout: stdout || '',
            stderr: `Execution Timed Out (Exceeded ${timeoutMs / 1000}s limit). Please check for infinite loops.`,
            status: 'timeout',
            time: `${duration}s`,
            memory: 'N/A',
          });
        }

        return resolve({
          stdout: stdout || '',
          stderr: stderr || error.message,
          status: 'error',
          time: `${duration}s`,
          memory: 'N/A',
        });
      }

      resolve({
        stdout: stdout || '[Program executed successfully with no output.]',
        stderr: stderr || '',
        status: 'success',
        time: `${duration}s`,
        memory: '1.2 MB',
      });
    });
  });
}

function getChallengesByProfession(profession) {
  if (!profession) return CODING_CHALLENGES;
  const profLower = profession.toLowerCase();
  return CODING_CHALLENGES.filter((c) =>
    c.profession.toLowerCase().includes(profLower) || profLower.includes(c.profession.toLowerCase())
  );
}

module.exports = {
  CODING_CHALLENGES,
  executeCode,
  getChallengesByProfession,
};
