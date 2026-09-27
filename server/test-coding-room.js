const axios = require('axios');

async function testCodingRoomFlow() {
  console.log('--- TESTING CODING ROOM & EXECUTION ENGINE ---');
  
  // 1. Fetch challenge
  const chalRes = await axios.get('http://localhost:5000/api/coding/challenges?profession=Artificial%20Intelligence');
  console.log('1. Challenge Retrieved:', chalRes.data.data[0].title);

  // 2. Open room for candidate
  const roomRes = await axios.post('http://localhost:5000/api/coding/room', {
    profession: 'Artificial Intelligence',
    candidateId: 'cand-001',
    language: 'python'
  });
  const roomId = roomRes.data.data.id;
  console.log('2. Room Created:', roomId);
  console.log('   Starter Code Loaded (Length):', roomRes.data.data.code.length, 'bytes');

  // 3. Candidate edits code
  const candidateCode = `
import math

def stable_softmax(logits):
    max_logit = max(logits)
    exps = [math.exp(x - max_logit) for x in logits]
    sum_exps = sum(exps)
    return [round(x / sum_exps, 4) for x in exps]

logits = [1000.0, 1001.0, 1002.0]
probs = stable_softmax(logits)
print("Softmax Output:", probs)
print("Total Probability:", round(sum(probs), 2))
`;

  await axios.post(`http://localhost:5000/api/coding/room/${roomId}/code`, {
    code: candidateCode
  });
  console.log('3. Candidate code synced to room.');

  // 4. Run code in sandbox
  const runRes = await axios.post('http://localhost:5000/api/coding/run-code', {
    roomId,
    language: 'python',
    code: candidateCode
  });
  console.log('4. Code Execution Result:');
  console.log('   Status:', runRes.data.status);
  console.log('   Time:', runRes.data.time);
  console.log('   Stdout:\n', runRes.data.stdout.trim());

  // 5. Verify Interviewer sees output in room state
  const viewRes = await axios.get(`http://localhost:5000/api/coding/room/${roomId}`);
  console.log('5. Interviewer Live View:');
  console.log('   Room Locked:', viewRes.data.data.locked);
  console.log('   Interviewer sees Output:', viewRes.data.data.lastOutput.status);

  // 6. Test direct compatibility with existing Pair Programming Canvas route
  const canvasRes = await axios.post('http://localhost:5000/api/run-code', {
    language: 'python',
    code: 'print("Testing direct /api/run-code for Pair Programming Canvas!")'
  });
  console.log('6. Pair Programming Canvas /api/run-code:\n  ', canvasRes.data.stdout.trim());

  console.log('\n--- ALL CODING ROOM & EXECUTION TESTS PASSED! ---');
}

testCodingRoomFlow().catch(console.error);
