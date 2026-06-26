/**
 * AdaptIQ — Adaptive Learning Platform
 * Authors: Kafeero Mirembe Mercy & Kukiriza Samuel
 * Hackathon 2025
 */

/* ============================================================
   STATE
   ============================================================ */
const STATE = {
  user: { name: '', level: 'beginner', topic: '' },
  keys: { gemini: '', featherless: '' },
  xp: 0,
  sessions: 0,
  mastery: 0,
  streak: 1,
  topicMastery: {},
  activityLog: [],
  xpHistory: [],
  quiz: {
    questions: [],
    current: 0,
    score: 0,
    topic: '',
    answers: [],
    generated: false
  },
  tutorModel: 'gemini',
  tutorFeatherlessModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
  chatHistory: []
};

/* ============================================================
   INITIALIZATION
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  initNeuralCanvas();

  // Chip selection
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });

  // If already configured, go straight to app
  if (STATE.keys.gemini && STATE.user.name) {
    showApp();
  }
});

/* ============================================================
   PERSISTENCE
   ============================================================ */
function saveState() {
  try {
    localStorage.setItem('adaptiq_state', JSON.stringify(STATE));
  } catch (e) { /* ignore */ }
}

function loadState() {
  try {
    const saved = localStorage.getItem('adaptiq_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(STATE, parsed);
    }
  } catch (e) { /* ignore */ }
}

/* ============================================================
   ONBOARDING
   ============================================================ */
function showOnboarding() {
  document.getElementById('onboarding-modal').classList.remove('hidden');
  document.getElementById('step-1').classList.remove('hidden');
  document.getElementById('step-2').classList.add('hidden');
  document.getElementById('step-3').classList.add('hidden');
}

function closeOnboarding() {
  document.getElementById('onboarding-modal').classList.add('hidden');
}

function goToStep2() {
  const name = document.getElementById('user-name').value.trim();
  const selectedChip = document.querySelector('.chip.selected');
  const customTopic = document.getElementById('custom-topic').value.trim();
  const topic = customTopic || (selectedChip ? selectedChip.dataset.topic : '');

  if (!name) { showToast('Please enter your name', 'error'); return; }
  if (!topic) { showToast('Please select or type a topic', 'error'); return; }

  STATE.user.name = name;
  STATE.user.topic = topic;

  document.getElementById('step-1').classList.add('hidden');
  document.getElementById('step-2').classList.remove('hidden');
}

function selectLevel(el) {
  document.querySelectorAll('.level-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  STATE.user.level = el.dataset.level;
}

function goToStep3() {
  if (!STATE.user.level) { showToast('Please select your level', 'error'); return; }
  document.getElementById('step-2').classList.add('hidden');
  document.getElementById('step-3').classList.remove('hidden');
}

function launchApp() {
  const geminiKey = document.getElementById('gemini-key').value.trim();
  const featherlessKey = document.getElementById('featherless-key').value.trim();

  if (!geminiKey) { showToast('Gemini API key is required', 'error'); return; }

  STATE.keys.gemini = geminiKey;
  STATE.keys.featherless = featherlessKey;
  STATE.xpHistory = [{ label: 'Start', xp: 0 }];

  saveState();
  closeOnboarding();
  showApp();
}

/* ============================================================
   APP BOOTSTRAP
   ============================================================ */
function showApp() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');

  // Update UI with user info
  const name = STATE.user.name || 'Learner';
  const initial = name.charAt(0).toUpperCase();
  document.getElementById('sidebar-avatar').textContent = initial;
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('sidebar-level').textContent = STATE.user.level;
  document.getElementById('greeting-name').textContent = name.split(' ')[0];
  document.getElementById('learn-topic-title').textContent = STATE.user.topic || 'Your Topic';
  document.getElementById('learn-topic-input').value = STATE.user.topic || '';
  document.getElementById('quiz-topic-input').value = STATE.user.topic || '';
  document.getElementById('tutor-context').value = STATE.user.topic || '';

  // Greeting time
  const hour = new Date().getHours();
  document.getElementById('greeting-time').textContent =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  updateAPIStatus();
  updateStats();
  renderActivityLog();
  renderProgressTab();
  generateLearningPath();

  // Restore settings fields
  document.getElementById('settings-name').value = STATE.user.name || '';
  document.getElementById('settings-topic').value = STATE.user.topic || '';
  document.getElementById('settings-gemini-key').value = STATE.keys.gemini || '';
  document.getElementById('settings-featherless-key').value = STATE.keys.featherless || '';
  document.getElementById('settings-level').value = STATE.user.level || 'beginner';
}

function showDemo() {
  showToast('Fill in your details to try the full demo!', 'info');
  showOnboarding();
}

/* ============================================================
   API STATUS
   ============================================================ */
function updateAPIStatus() {
  const gDot = document.getElementById('gemini-dot');
  const fDot = document.getElementById('featherless-dot');

  if (STATE.keys.gemini) {
    gDot.classList.add('active');
    document.getElementById('gemini-status-text').textContent = 'Gemini ✓';
  } else {
    gDot.classList.add('error');
  }

  if (STATE.keys.featherless) {
    fDot.classList.add('active');
    document.getElementById('featherless-status-text').textContent = 'Featherless ✓';
  }
}

/* ============================================================
   TAB NAVIGATION
   ============================================================ */
function showTab(tabName, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`tab-${tabName}`).classList.add('active');
  if (btn) btn.classList.add('active');

  if (tabName === 'progress') renderProgressTab();
}

/* ============================================================
   STATS
   ============================================================ */
function updateStats() {
  document.getElementById('streak-count').textContent = STATE.streak || 1;
  document.getElementById('xp-count').textContent = STATE.xp || 0;
  document.getElementById('mastery-count').textContent = (STATE.mastery || 0) + '%';
  document.getElementById('sessions-count').textContent = STATE.sessions || 0;
}

function addXP(amount, reason) {
  STATE.xp += amount;
  STATE.sessions += 1;
  const topics = Object.keys(STATE.topicMastery);
  if (topics.length > 0) {
    const avg = topics.reduce((s, t) => s + STATE.topicMastery[t], 0) / topics.length;
    STATE.mastery = Math.min(100, Math.round(avg));
  }
  STATE.xpHistory.push({ label: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), xp: STATE.xp });

  addActivity(`${reason} (+${amount} XP)`, amount >= 50 ? '⭐' : '✅');
  updateStats();
  saveState();
  showToast(`+${amount} XP — ${reason}`, 'success');
}

function addActivity(text, icon = '📌') {
  STATE.activityLog.unshift({
    text,
    icon,
    time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
  });
  if (STATE.activityLog.length > 20) STATE.activityLog.pop();
  renderActivityLog();
}

function renderActivityLog() {
  const el = document.getElementById('activity-log');
  if (!el) return;
  if (STATE.activityLog.length === 0) {
    el.innerHTML = '<div class="empty-state">No activity yet — start learning!</div>';
    return;
  }
  el.innerHTML = STATE.activityLog.slice(0, 10).map(a => `
    <div class="activity-item">
      <span class="activity-icon">${a.icon}</span>
      <span class="activity-text">${escapeHtml(a.text)}</span>
      <span class="activity-time">${a.time}</span>
    </div>
  `).join('');
}

/* ============================================================
   NEURAL CANVAS ANIMATION
   ============================================================ */
function initNeuralCanvas() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const nodes = Array.from({length: 55}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2 + 1.5,
    pulse: Math.random() * Math.PI * 2
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() * 0.001;

    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      n.pulse += 0.02;
    });

    // Edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.5;
          const gradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
          gradient.addColorStop(0, `rgba(124, 58, 237, ${alpha})`);
          gradient.addColorStop(1, `rgba(6, 182, 212, ${alpha})`);
          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.8;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Nodes
    nodes.forEach(n => {
      const glow = Math.sin(n.pulse) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 58, 237, ${glow})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
}

/* ============================================================
   LEARNING PATH
   ============================================================ */
async function generateLearningPath() {
  const container = document.getElementById('learning-path-vis');
  if (!container) return;
  if (!STATE.keys.gemini) {
    container.innerHTML = '<div class="path-loading">Set up your Gemini API key to generate a path.</div>';
    return;
  }

  container.innerHTML = '<div class="path-loading"><span class="spinner"></span>Generating your path...</div>';

  const topic = STATE.user.topic || 'General Knowledge';
  const level = STATE.user.level || 'beginner';

  try {
    const prompt = `Create a learning path for "${topic}" at ${level} level. Return ONLY a JSON array of exactly 5 objects, no markdown, no code fences. Each object: {"title":"string","description":"string","status":"done|current|locked"}. First item done, second current, rest locked.`;

    const data = await callGemini(prompt);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();

    let path;
    try { path = JSON.parse(cleaned); }
    catch { path = defaultPath(topic); }

    container.innerHTML = path.map((node, i) => `
      <div class="path-node">
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div class="path-circle ${node.status || 'locked'}">
            ${node.status === 'done' ? '✓' : node.status === 'current' ? '●' : String(i + 1)}
          </div>
          ${i < path.length - 1 ? '<div class="path-line"></div>' : ''}
        </div>
        <div class="path-node-info" onclick="quickLearn('${escapeAttr(node.title)}')" style="cursor:pointer">
          <div class="path-node-title">${escapeHtml(node.title)}</div>
          <div class="path-node-sub">${escapeHtml(node.description)}</div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = defaultPathHTML(topic);
  }
}

function defaultPath(topic) {
  return [
    {title: 'Introduction to ' + topic, description: 'Core concepts & terminology', status: 'done'},
    {title: 'Fundamentals', description: 'Building blocks & principles', status: 'current'},
    {title: 'Intermediate Concepts', description: 'Deeper exploration', status: 'locked'},
    {title: 'Advanced Topics', description: 'Expert-level material', status: 'locked'},
    {title: 'Mastery Project', description: 'Apply everything you\'ve learned', status: 'locked'}
  ];
}

function defaultPathHTML(topic) {
  return defaultPath(topic).map((n, i, arr) => `
    <div class="path-node">
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div class="path-circle ${n.status}">${n.status==='done'?'✓':n.status==='current'?'●':String(i+1)}</div>
        ${i < arr.length - 1 ? '<div class="path-line"></div>' : ''}
      </div>
      <div class="path-node-info">
        <div class="path-node-title">${n.title}</div>
        <div class="path-node-sub">${n.description}</div>
      </div>
    </div>
  `).join('');
}

function quickLearn(subtopic) {
  document.getElementById('learn-subtopic-input').value = subtopic;
  showTab('learn', document.querySelector('.nav-item:nth-child(2)'));
  generateLesson();
}

/* ============================================================
   GEMINI API
   ============================================================ */
async function callGemini(prompt, systemInstruction = '') {
  if (!STATE.keys.gemini) throw new Error('No Gemini API key');

  const body = {
    contents: [{ parts: [{ text: prompt }], role: 'user' }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${STATE.keys.gemini}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }

  return res.json();
}

/* ============================================================
   FEATHERLESS API
   ============================================================ */
async function callFeatherless(messages, model) {
  if (!STATE.keys.featherless) throw new Error('No Featherless API key');

  const res = await fetch('https://api.featherless.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STATE.keys.featherless}`
    },
    body: JSON.stringify({
      model: model || STATE.tutorFeatherlessModel,
      messages,
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Featherless API error: ${res.status}`);
  }

  return res.json();
}

/* ============================================================
   LESSON GENERATION
   ============================================================ */
async function generateLesson() {
  const topic = document.getElementById('learn-topic-input').value.trim() || STATE.user.topic;
  const subtopic = document.getElementById('learn-subtopic-input').value.trim();
  const modelChoice = document.getElementById('learn-model').value;

  if (!topic) { showToast('Please enter a topic', 'error'); return; }
  if (modelChoice === 'featherless' && !STATE.keys.featherless) {
    showToast('Add a Featherless API key in Settings to use this model', 'error'); return;
  }

  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Generating...';

  const container = document.getElementById('lesson-container');
  container.innerHTML = `
    <div class="lesson-placeholder">
      <span class="spinner" style="width:32px;height:32px;border-width:3px;"></span>
      <p>AdaptIQ is crafting your personalized lesson...</p>
    </div>`;

  const fullTopic = subtopic ? `${subtopic} (in the context of ${topic})` : topic;
  const level = STATE.user.level;
  const prompt = `You are an expert educator creating a comprehensive, engaging lesson.

Topic: ${fullTopic}
Student Level: ${level}
Student Name: ${STATE.user.name}

Create a well-structured lesson with:
1. An engaging introduction paragraph
2. Key concepts (at least 3-4) with clear explanations
3. Real-world examples or analogies
4. Practice exercise or reflection question
5. Summary of key takeaways

Format with clear headings using ## and ###. Use **bold** for important terms. Use code blocks if relevant. Make it appropriate for a ${level} learner. Be thorough but accessible.`;

  try {
    let lessonText = '';

    if (modelChoice === 'featherless') {
      const data = await callFeatherless([
        { role: 'system', content: `You are an expert, engaging educator. Adapt your explanations to ${level} level learners. Use clear formatting.` },
        { role: 'user', content: prompt }
      ]);
      lessonText = data.choices?.[0]?.message?.content || '';
    } else {
      const data = await callGemini(prompt);
      lessonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (!lessonText) throw new Error('Empty response');

    const html = markdownToHTML(lessonText);
    const modelLabel = modelChoice === 'featherless' ? 'Featherless AI' : 'Gemini';

    container.innerHTML = `
      <div class="lesson-meta">
        <span class="lesson-tag">${escapeHtml(fullTopic)}</span>
        <span class="lesson-tag">${level}</span>
        <span class="lesson-tag cyan">${modelLabel}</span>
      </div>
      <div class="lesson-content">${html}</div>
      <div class="lesson-actions">
        <button class="btn-primary" onclick="generateQuizFromLesson('${escapeAttr(topic)}')">Quiz Me On This 🎯</button>
        <button class="btn-ghost" onclick="generateLesson()">Regenerate ↺</button>
        <button class="btn-ghost" onclick="askTutorAbout('${escapeAttr(fullTopic)}')">Ask Tutor 🤖</button>
      </div>`;

    // Update topic mastery
    if (!STATE.topicMastery[topic]) STATE.topicMastery[topic] = 10;
    else STATE.topicMastery[topic] = Math.min(100, STATE.topicMastery[topic] + 5);

    addXP(25, `Completed lesson: ${subtopic || topic}`);
  } catch (err) {
    container.innerHTML = `
      <div class="lesson-placeholder">
        <div class="placeholder-icon">⚠️</div>
        <p style="color:#FCA5A5;">${escapeHtml(err.message)}</p>
        <button class="btn-ghost" onclick="generateLesson()" style="margin-top:12px;">Try Again</button>
      </div>`;
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Generate Lesson ⚡';
  }
}

function generateQuizFromLesson(topic) {
  document.getElementById('quiz-topic-input').value = topic;
  showTab('quiz', document.querySelector('.nav-item:nth-child(3)'));
  generateQuiz();
}

function askTutorAbout(topic) {
  document.getElementById('tutor-context').value = topic;
  document.getElementById('chat-input').value = `Can you explain the key concepts of ${topic} in a way that matches my ${STATE.user.level} level?`;
  showTab('tutor', document.querySelector('.nav-item:nth-child(4)'));
}

/* ============================================================
   QUIZ
   ============================================================ */
async function generateQuiz() {
  const topic = document.getElementById('quiz-topic-input').value.trim() || STATE.user.topic;
  const count = parseInt(document.getElementById('quiz-count').value);
  const difficultyPref = document.getElementById('quiz-difficulty').value;
  const difficulty = difficultyPref === 'auto' ? STATE.user.level : difficultyPref;

  if (!topic) { showToast('Please enter a quiz topic', 'error'); return; }
  if (!STATE.keys.gemini) { showToast('Gemini API key required', 'error'); return; }

  const btn = document.getElementById('quiz-gen-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Generating...';

  const prompt = `Create ${count} multiple-choice quiz questions about "${topic}" for a ${difficulty} level student.

Return ONLY a valid JSON array. No markdown, no code fences, no extra text. Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Why this answer is correct"
  }
]

The "correct" field is the 0-based index of the correct option. Make questions clear, educational, and appropriately challenging for ${difficulty} level.`;

  try {
    const data = await callGemini(prompt);
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json|```/g, '').trim();

    let questions;
    try { questions = JSON.parse(text); }
    catch {
      // Try to extract JSON array
      const match = text.match(/\[[\s\S]*\]/);
      if (match) questions = JSON.parse(match[0]);
      else throw new Error('Could not parse quiz response');
    }

    if (!Array.isArray(questions) || questions.length === 0) throw new Error('Invalid quiz format');

    STATE.quiz = {
      questions,
      current: 0,
      score: 0,
      topic,
      answers: [],
      generated: true
    };

    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('quiz-results').classList.add('hidden');

    renderQuestion();
  } catch (err) {
    showToast('Quiz generation failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Generate Quiz ⚡';
  }
}

function renderQuestion() {
  const { questions, current } = STATE.quiz;
  const q = questions[current];
  const total = questions.length;

  document.getElementById('quiz-q-label').textContent = `Question ${current + 1} of ${total}`;
  document.getElementById('quiz-score-live').textContent = `Score: ${STATE.quiz.score}`;
  document.getElementById('quiz-progress-fill').style.width = `${(current / total) * 100}%`;
  document.getElementById('quiz-question-text').textContent = q.question;
  document.getElementById('quiz-feedback').classList.add('hidden');
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-next-btn').classList.add('hidden');

  const letters = ['A', 'B', 'C', 'D'];
  const optEl = document.getElementById('quiz-options-list');
  optEl.innerHTML = q.options.map((opt, i) => `
    <button class="quiz-option" onclick="selectAnswer(${i})" data-index="${i}">
      <div class="option-letter">${letters[i]}</div>
      <span>${escapeHtml(opt)}</span>
    </button>
  `).join('');
}

function selectAnswer(selectedIdx) {
  const { questions, current } = STATE.quiz;
  const q = questions[current];
  const correct = q.correct;
  const isCorrect = selectedIdx === correct;

  // Disable all options
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.disabled = true;
    const idx = parseInt(btn.dataset.index);
    if (idx === correct) btn.classList.add('correct');
    if (idx === selectedIdx && !isCorrect) btn.classList.add('incorrect');
    if (idx === selectedIdx && isCorrect) btn.classList.add('selected-correct');
  });

  const feedback = document.getElementById('quiz-feedback');
  feedback.classList.remove('hidden', 'correct-fb', 'wrong-fb');

  if (isCorrect) {
    STATE.quiz.score++;
    feedback.classList.add('correct-fb');
    feedback.textContent = '✓ Correct! ' + (q.explanation || '');
  } else {
    feedback.classList.add('wrong-fb');
    feedback.textContent = '✗ Not quite. ' + (q.explanation || '') + ` The correct answer was: ${q.options[correct]}`;
  }

  STATE.quiz.answers.push({ selected: selectedIdx, correct, isCorrect });
  document.getElementById('quiz-next-btn').classList.remove('hidden');
}

function nextQuestion() {
  STATE.quiz.current++;
  if (STATE.quiz.current >= STATE.quiz.questions.length) {
    showQuizResults();
  } else {
    renderQuestion();
  }
}

function showQuizResults() {
  document.getElementById('quiz-area').classList.add('hidden');
  document.getElementById('quiz-results').classList.remove('hidden');

  const { score, questions, topic } = STATE.quiz;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);

  document.getElementById('results-score').textContent = `${score}/${total}`;

  let emoji, title, msg;
  if (pct >= 90) { emoji = '🏆'; title = 'Outstanding!'; msg = 'You have excellent mastery of this topic!'; }
  else if (pct >= 70) { emoji = '🎉'; title = 'Great Job!'; msg = 'You have a solid understanding. Keep going!'; }
  else if (pct >= 50) { emoji = '📈'; title = 'Good Progress!'; msg = 'You\'re getting there. Review and try again!'; }
  else { emoji = '💪'; title = 'Keep Practicing!'; msg = 'Learning takes time. Review the lesson and retry.'; }

  document.getElementById('results-emoji').textContent = emoji;
  document.getElementById('results-title').textContent = title;
  document.getElementById('results-message').textContent = msg;

  const breakdown = document.getElementById('results-breakdown');
  breakdown.innerHTML = STATE.quiz.answers.map((a, i) => `
    <div class="result-row">
      <span class="res-icon">${a.isCorrect ? '✅' : '❌'}</span>
      <span>Q${i + 1}: ${a.isCorrect ? 'Correct' : 'Incorrect'}</span>
    </div>
  `).join('');

  // Update mastery
  if (!STATE.topicMastery[topic]) STATE.topicMastery[topic] = 0;
  STATE.topicMastery[topic] = Math.min(100, STATE.topicMastery[topic] + pct * 0.5);

  addXP(pct >= 70 ? 50 : 20, `Quiz on ${topic}: ${score}/${total}`);
}

function retakeQuiz() {
  document.getElementById('quiz-results').classList.add('hidden');
  document.getElementById('quiz-setup').classList.remove('hidden');
  document.getElementById('quiz-area').classList.add('hidden');
}

/* ============================================================
   AI TUTOR
   ============================================================ */
function selectTutorModel(model, btn) {
  STATE.tutorModel = model;
  document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const featherlessPicker = document.getElementById('featherless-model-picker');
  if (model === 'featherless') {
    featherlessPicker.classList.remove('hidden');
    if (!STATE.keys.featherless) {
      showToast('Add a Featherless API key in Settings', 'error');
    }
  } else {
    featherlessPicker.classList.add('hidden');
  }
}

function useQuickPrompt(text) {
  const ctx = document.getElementById('tutor-context').value.trim();
  document.getElementById('chat-input').value = ctx ? `${text} about ${ctx}` : text;
  document.getElementById('chat-input').focus();
}

async function sendTutorMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  const model = STATE.tutorModel;
  if (model === 'gemini' && !STATE.keys.gemini) { showToast('Add Gemini API key in Settings', 'error'); return; }
  if (model === 'featherless' && !STATE.keys.featherless) { showToast('Add Featherless API key in Settings', 'error'); return; }

  // Show user message
  appendChatMsg('user', msg, STATE.user.name?.charAt(0) || 'U');
  input.value = '';

  // Typing indicator
  const typingId = 'typing-' + Date.now();
  const chatMsgs = document.getElementById('chat-messages');
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg assistant';
  typingEl.id = typingId;
  typingEl.innerHTML = `
    <div class="msg-avatar ai-av">AI</div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  chatMsgs.appendChild(typingEl);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;

  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;

  // Build system prompt
  const ctx = document.getElementById('tutor-context').value.trim();
  const systemPrompt = `You are an adaptive AI tutor on the AdaptIQ platform. 
Student: ${STATE.user.name || 'Student'}
Level: ${STATE.user.level || 'beginner'}
${ctx ? `Current study topic: ${ctx}` : ''}

Adapt your explanations to their ${STATE.user.level || 'beginner'} level. Be encouraging, clear, and educational. Use examples. Keep responses focused and helpful. Format with markdown where it helps clarity.`;

  STATE.chatHistory.push({ role: 'user', content: msg });

  try {
    let reply = '';

    if (model === 'featherless') {
      const modelId = document.getElementById('featherless-model-select').value;
      const messages = [
        { role: 'system', content: systemPrompt },
        ...STATE.chatHistory.slice(-10)
      ];
      const data = await callFeatherless(messages, modelId);
      reply = data.choices?.[0]?.message?.content || 'No response';
    } else {
      const conversationPrompt = STATE.chatHistory.length > 1
        ? STATE.chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n\n')
        : msg;

      const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationPrompt}\n\nTutor:`;
      const data = await callGemini(fullPrompt);
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    }

    STATE.chatHistory.push({ role: 'assistant', content: reply });
    if (STATE.chatHistory.length > 20) STATE.chatHistory = STATE.chatHistory.slice(-20);

    // Remove typing, add response
    document.getElementById(typingId)?.remove();
    appendChatMsg('assistant', reply, 'AI');

  } catch (err) {
    document.getElementById(typingId)?.remove();
    appendChatMsg('assistant', `⚠️ Error: ${err.message}. Please check your API key in Settings.`, 'AI');
    showToast(err.message, 'error');
  } finally {
    sendBtn.disabled = false;
  }
}

function appendChatMsg(role, text, avatarLetter) {
  const chatMsgs = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = `chat-msg ${role}`;

  const html = markdownToHTML(text);
  el.innerHTML = `
    <div class="msg-avatar ${role === 'assistant' ? 'ai-av' : 'user-av'}">${avatarLetter}</div>
    <div class="msg-bubble">${html}</div>`;

  chatMsgs.appendChild(el);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

/* ============================================================
   PROGRESS TAB
   ============================================================ */
function renderProgressTab() {
  // Topic mastery bars
  const list = document.getElementById('topic-mastery-list');
  const topics = Object.entries(STATE.topicMastery);
  if (topics.length === 0) {
    list.innerHTML = '<div class="empty-state">Complete lessons and quizzes to see mastery breakdown.</div>';
  } else {
    list.innerHTML = topics.map(([topic, pct]) => `
      <div class="mastery-row">
        <div class="mastery-topic-name">${escapeHtml(topic)}</div>
        <div class="mastery-bar-bg">
          <div class="mastery-bar-fill" style="width:${Math.round(pct)}%"></div>
        </div>
        <div class="mastery-pct">${Math.round(pct)}%</div>
      </div>
    `).join('');
  }

  // Mastery ring
  drawMasteryRing();
  drawXPChart();
}

function drawMasteryRing() {
  const canvas = document.getElementById('mastery-ring');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const pct = (STATE.mastery || 0) / 100;
  const cx = 80, cy = 80, r = 65;

  ctx.clearRect(0, 0, 160, 160);

  // Background ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 12;
  ctx.stroke();

  // Progress ring
  if (pct > 0) {
    const gradient = ctx.createLinearGradient(0, 0, 160, 160);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#06B6D4');
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  document.getElementById('mastery-ring-label').textContent = (STATE.mastery || 0) + '%';
}

function drawXPChart() {
  const canvas = document.getElementById('xp-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const history = STATE.xpHistory || [{ label: 'Start', xp: 0 }];
  const w = canvas.width, h = canvas.height;
  const pad = { top: 10, right: 10, bottom: 30, left: 40 };

  ctx.clearRect(0, 0, w, h);

  if (history.length < 2) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Complete lessons to see XP growth', w/2, h/2);
    return;
  }

  const maxXP = Math.max(...history.map(d => d.xp)) || 1;
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const xScale = i => pad.left + (i / (history.length - 1)) * chartW;
  const yScale = xp => pad.top + chartH - (xp / maxXP) * chartH;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxXP * (1 - i / 4)), pad.left - 4, y + 4);
  }

  // Fill gradient
  const fillGrad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
  fillGrad.addColorStop(0, 'rgba(124, 58, 237, 0.3)');
  fillGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

  ctx.beginPath();
  ctx.moveTo(xScale(0), yScale(history[0].xp));
  history.forEach((d, i) => { if (i > 0) ctx.lineTo(xScale(i), yScale(d.xp)); });
  ctx.lineTo(xScale(history.length - 1), h - pad.bottom);
  ctx.lineTo(xScale(0), h - pad.bottom);
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // Line
  const lineGrad = ctx.createLinearGradient(pad.left, 0, w, 0);
  lineGrad.addColorStop(0, '#7C3AED');
  lineGrad.addColorStop(1, '#06B6D4');

  ctx.beginPath();
  ctx.moveTo(xScale(0), yScale(history[0].xp));
  history.forEach((d, i) => { if (i > 0) ctx.lineTo(xScale(i), yScale(d.xp)); });
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots
  history.forEach((d, i) => {
    ctx.beginPath();
    ctx.arc(xScale(i), yScale(d.xp), 4, 0, Math.PI * 2);
    ctx.fillStyle = '#7C3AED';
    ctx.fill();
    ctx.strokeStyle = '#0B0F1A';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // X labels
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px Inter';
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(history.length / 5));
  history.forEach((d, i) => {
    if (i % step === 0 || i === history.length - 1) {
      ctx.fillText(d.label, xScale(i), h - 8);
    }
  });
}

/* ============================================================
   SETTINGS
   ============================================================ */
function showSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
  STATE.user.name = document.getElementById('settings-name').value.trim() || STATE.user.name;
  STATE.user.topic = document.getElementById('settings-topic').value.trim() || STATE.user.topic;
  STATE.user.level = document.getElementById('settings-level').value;

  const newGemini = document.getElementById('settings-gemini-key').value.trim();
  const newFeatherless = document.getElementById('settings-featherless-key').value.trim();
  if (newGemini) STATE.keys.gemini = newGemini;
  if (newFeatherless) STATE.keys.featherless = newFeatherless;

  saveState();
  closeSettings();

  // Refresh UI
  document.getElementById('sidebar-name').textContent = STATE.user.name;
  document.getElementById('sidebar-level').textContent = STATE.user.level;
  document.getElementById('sidebar-avatar').textContent = STATE.user.name.charAt(0).toUpperCase();
  updateAPIStatus();

  showToast('Settings saved!', 'success');
}

function resetApp() {
  if (!confirm('This will reset all your progress and settings. Are you sure?')) return;
  localStorage.removeItem('adaptiq_state');
  location.reload();
}

/* ============================================================
   UTILITIES
   ============================================================ */
function toggleKey(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { toast.className = 'toast hidden'; }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * Minimal Markdown → HTML converter
 */
function markdownToHTML(md) {
  if (!md) return '';

  let html = md;

  // Code blocks (must do before other processing)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${escapeHtml(code.trim())}</code></pre>`);

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');
  // Clean up nested ul
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0;">');

  // Paragraphs — wrap lines that aren't already wrapped in a block tag
  const lines = html.split('\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr)/.test(line) || /<\/(h[1-6]|ul|ol|li|pre|blockquote)>$/.test(line)) {
      result.push(line);
    } else {
      result.push(`<p>${line}</p>`);
    }
  }

  return result.join('\n');
}
