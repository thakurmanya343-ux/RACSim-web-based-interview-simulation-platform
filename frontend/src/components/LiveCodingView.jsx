import React, { useState } from 'react';
import { Play, RotateCcw, Lock, Unlock, Terminal, CheckCircle2, AlertCircle, Code2, Sparkles } from 'lucide-react';

const STARTER_CODES = {
  python: `# Coding Challenge: Real-Time Object Detection Bounding Box Intersection (IoU)
# Write a function to compute Intersection over Union (IoU) between two bounding boxes [x1, y1, x2, y2].

def compute_iou(boxA, boxB):
    # Determine coordinates of the intersection rectangle
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    # Compute area of intersection rectangle
    interArea = max(0, xB - xA) * max(0, yB - yA)

    # Compute the area of both prediction and ground-truth rectangles
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

    # Compute IoU
    iou = interArea / float(boxAArea + boxBArea - interArea)
    return round(iou, 4)

# Test cases
box1 = [50, 50, 150, 150]
box2 = [100, 100, 200, 200]
print("Computed IoU:", compute_iou(box1, box2))
`,
  javascript: `// Coding Challenge: Balanced Binary Tree Verification
// Determine if a binary tree is height-balanced.

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function isBalanced(root) {
  function check(node) {
    if (!node) return 0;
    const left = check(node.left);
    if (left === -1) return -1;
    const right = check(node.right);
    if (right === -1) return -1;
    if (Math.abs(left - right) > 1) return -1;
    return Math.max(left, right) + 1;
  }
  return check(root) !== -1;
}

const root = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
console.log("Is tree balanced:", isBalanced(root));
`
};

export default function LiveCodingView() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTER_CODES.python);
  const [isLocked, setIsLocked] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [outputResult, setOutputResult] = useState({
    stdout: 'Ready. Press "Run Code Sandbox" to execute in backend runtime.',
    stderr: '',
    status: 'idle',
    time: '0.00s',
    memory: '0 KB'
  });

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODES[lang] || '');
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      });

      const data = await response.json();
      setOutputResult({
        stdout: data.stdout || 'Program exited with no standard output.',
        stderr: data.stderr || '',
        status: data.status || (data.stderr ? 'error' : 'success'),
        time: data.time || '0.04s',
        memory: data.memory || '14.2 MB'
      });
    } catch (err) {
      setOutputResult({
        stdout: '',
        stderr: err.message,
        status: 'error',
        time: '0.00s',
        memory: '0 KB'
      });
    }
    setIsRunning(false);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#111111',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 30px',
          color: '#ffffff',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="pulse-dot-green" />
            <span style={{ fontSize: '0.75rem', color: 'var(--forest-green-border)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Selector Board Room Sandbox
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 500, margin: 0 }}>
            Live Pair-Programming & Coding Assessment Sandbox
          </h2>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #475569',
              background: '#334155',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            <option value="python">Python 3.14</option>
            <option value="javascript">Node.js (JavaScript)</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsLocked(!isLocked)}
            style={{ background: isLocked ? '#f59e0b' : '#334155', color: '#fff', border: 'none' }}
            title="Interviewer panel editor lock"
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            {isLocked ? 'Editor Locked' : 'Lock Editor'}
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleRunCode}
            disabled={isRunning}
            style={{ background: '#10b981', padding: '8px 18px', fontWeight: 700 }}
          >
            <Play size={14} /> {isRunning ? 'Executing...' : 'Run Code Sandbox'}
          </button>
        </div>
      </div>

      {/* Split Code Editor & Output Console */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '18px' }}>
        {/* Editor Area */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #334155', background: '#0f172a' }}>
          <div style={{ padding: '10px 16px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              main.{language === 'python' ? 'py' : 'js'}
            </span>
            <button
              onClick={() => setCode(STARTER_CODES[language] || '')}
              style={{ fontSize: '0.74rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Reset Code
            </button>
          </div>

          <textarea
            value={code}
            onChange={(e) => !isLocked && setCode(e.target.value)}
            disabled={isLocked}
            rows={18}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              fontFamily: '"Fira Code", monospace, "Courier New"',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              border: 'none',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Terminal Console Output */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #334155', background: '#090d16', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700 }}>
              <Terminal size={14} /> Execution Console
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', color: '#94a3b8' }}>
              <span>Time: <strong>{outputResult.time}</strong></span>
              <span>Memory: <strong>{outputResult.memory}</strong></span>
            </div>
          </div>

          <div style={{ padding: '16px', flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.88rem' }}>
            {outputResult.stderr ? (
              <div style={{ color: '#f87171', whiteSpace: 'pre-wrap' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} /> Runtime Execution Error:
                </div>
                {outputResult.stderr}
              </div>
            ) : (
              <div style={{ color: '#4ade80', whiteSpace: 'pre-wrap' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginBottom: '8px' }}>
                  $ {language === 'python' ? 'python' : 'node'} runner
                </div>
                {outputResult.stdout}
              </div>
            )}
          </div>

          <div style={{ padding: '8px 16px', background: '#131b2e', borderTop: '1px solid #334155', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Status: <strong style={{ color: outputResult.status === 'error' ? '#f87171' : '#4ade80' }}>{outputResult.status}</strong></span>
            <span>Real Node / Python execution sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
}
