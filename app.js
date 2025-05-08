const FOCUS_KEY = 'focus_sessions';

// --- audio beep ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.frequency.value = 600;
  gain.gain.value = 0.1;
  osc.start();
  setTimeout(() => osc.stop(), 200);
}

// --- overlay ---
function showOverlay(isBreak) {
  const ov = document.getElementById('congrats-overlay');
  const h2 = ov.querySelector('h2');
  const p  = ov.querySelector('p');
  if (isBreak) {
    h2.textContent = "Break’s Over!";
    p.textContent  = "Time to focus 🍃";
  } else {
    h2.textContent = "Focus Complete!";
    p.textContent  = "Enjoy your break 🌱";
  }
  ov.classList.add('show');
  playBeep();
  setTimeout(() => ov.classList.remove('show'), 2000);
}

// --- Timer page logic ---
if (document.getElementById('start-btn')) {
  const circle = document.querySelector('.progress-ring__circle');
  const r      = circle.r.baseVal.value;
  const C      = 2 * Math.PI * r;
  circle.style.strokeDasharray  = `${C} ${C}`;
  circle.style.strokeDashoffset = C;

  let duration  = 25*60,
      remaining = duration,
      interval  = null,
      isBreak   = false;

  const disp     = document.getElementById('timer-display');
  const slider   = document.getElementById('time-slider');
  const tv       = document.getElementById('timer-value');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const breakSel = document.getElementById('break-selector');
  const breakBtn = document.getElementById('break-btn');

  function setProg(t) {
    circle.style.strokeDashoffset = C - (t/duration)*C;
  }
  function updDisp(sec) {
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    disp.textContent = `${m}:${s}`;
  }
  function recordFocus() {
    const arr = JSON.parse(localStorage.getItem(FOCUS_KEY))||[];
    arr.push({ timestamp: Date.now(), duration });
    localStorage.setItem(FOCUS_KEY, JSON.stringify(arr));
  }

  function startTimer(breakMode=false) {
    isBreak = breakMode;
    document.body.classList.toggle('break', breakMode);
    document.body.classList.toggle('running', !breakMode);
    [startBtn, pauseBtn, resetBtn, slider, breakBtn].forEach(el=>el.disabled=true);

    interval = setInterval(() => {
      remaining--;
      updDisp(remaining);
      setProg(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        [startBtn, pauseBtn, resetBtn, slider, breakBtn].forEach(el=>el.disabled=false);
        document.body.classList.remove('running','break');
        if (!isBreak) recordFocus();
        showOverlay(isBreak);
        remaining = duration;
        updDisp(remaining);
        setProg(remaining);
      }
    }, 1000);
  }

  // init
  slider.value   = duration/60;
  tv.textContent = duration/60;
  updDisp(remaining);
  setProg(remaining);

  slider.addEventListener('input', e => {
    duration  = parseInt(e.target.value,10)*60;
    remaining = duration;
    tv.textContent = parseInt(e.target.value,10);
    updDisp(remaining);
    setProg(remaining);
  });
  startBtn.addEventListener('click', ()=> startTimer(false));
  pauseBtn.addEventListener('click', ()=>{
    clearInterval(interval);
    [startBtn, pauseBtn, resetBtn, slider, breakBtn].forEach(el=>el.disabled=false);
    document.body.classList.remove('running','break');
  });
  resetBtn.addEventListener('click', ()=>{
    clearInterval(interval);
    [startBtn, pauseBtn, resetBtn, slider, breakBtn].forEach(el=>el.disabled=false);
    document.body.classList.remove('running','break');
    remaining = duration;
    updDisp(remaining);
    setProg(remaining);
  });
  breakBtn.addEventListener('click', ()=>{
    duration  = parseInt(breakSel.value,10)*60;
    remaining = duration;
    updDisp(remaining);
    setProg(remaining);
    startTimer(true);
  });
}

// --- Stats page logic ---
if (document.getElementById('today-total')) {
  const arr = JSON.parse(localStorage.getItem(FOCUS_KEY)) || [];
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sow = new Date(sod); sow.setDate(sow.getDate() - sow.getDay());
  const som = new Date(now.getFullYear(), now.getMonth(), 1);

  let d=0, w=0, m=0;
  arr.forEach(s => {
    const t = new Date(s.timestamp);
    if (t >= sod) d += s.duration;
    if (t >= sow) w += s.duration;
    if (t >= som) m += s.duration;
  });
  const toMin = sec => Math.round(sec/60);
  document.getElementById('today-total').textContent = toMin(d);
  document.getElementById('week-total').textContent  = toMin(w);
  document.getElementById('month-total').textContent = toMin(m);

  const treeCt = document.getElementById('tree-container');
  treeCt.innerHTML = '';
  arr.filter(s => new Date(s.timestamp) >= sow).forEach(_ => {
    const div = document.createElement('div');
    div.className   = 'tree-icon';
    div.textContent = '🌳';
    treeCt.appendChild(div);
  });
}

// --- To-Do List logic ---
if (document.getElementById('todo-form')) {
  const TODO_KEY = 'todo_tasks';
  const form      = document.getElementById('todo-form');
  const inputDesc = document.getElementById('todo-input');
  const selectImp = document.getElementById('importance-select');
  const selectUrg = document.getElementById('urgency-select');
  const inputDate = document.getElementById('due-date');
  const listEl    = document.getElementById('task-list');

  let tasks     = JSON.parse(localStorage.getItem(TODO_KEY)) || [];
  let editIndex = null;

  function saveTasks() {
    localStorage.setItem(TODO_KEY, JSON.stringify(tasks));
  }

  function renderTasks() {
    listEl.innerHTML = '';
    tasks.forEach((task, i) => {
      const li = document.createElement('li');
      li.className = 'task-item';
      if (task.done) li.classList.add('done');

      // 1) checkbox
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = task.done;
      cb.addEventListener('change', () => {
        task.done = cb.checked;
        saveTasks();
        li.classList.toggle('done', task.done);
      });
      li.appendChild(cb);

      // 2) description
      const desc = document.createElement('span');
      desc.className = 'task-desc';
      desc.textContent = task.desc;
      li.appendChild(desc);

      // 3) icons + due
      const icons = document.createElement('div');
      icons.className = 'task-icons';
      const impIcon = document.createElement('span');
      impIcon.className = 'imp-icon';
      impIcon.textContent = task.importance === 'high' ? '⭐' : '☆';
      icons.appendChild(impIcon);
      const urgIcon = document.createElement('span');
      urgIcon.className = 'urg-icon';
      urgIcon.textContent = task.urgency === 'high' ? '⚠️' : '⏰';
      icons.appendChild(urgIcon);
      const due = document.createElement('span');
      due.className = 'due-text';
      due.textContent = task.dueDate;
      icons.appendChild(due);
      li.appendChild(icons);

      // 4) edit btn
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => {
        inputDesc.value = task.desc;
        selectImp.value = task.importance;
        selectUrg.value = task.urgency;
        inputDate.value = task.dueDate;
        editIndex = i;
        form.querySelector('button[type="submit"]').textContent = 'Save';
      });
      li.appendChild(editBtn);

      // 5) delete btn
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.setAttribute('aria-label', 'Delete task');
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', () => {
        tasks.splice(i, 1);
        saveTasks();
        renderTasks();
      });
      li.appendChild(delBtn);

      listEl.appendChild(li);
    });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const desc       = inputDesc.value.trim();
    const importance = selectImp.value;
    const urgency    = selectUrg.value;
    const dueDate    = inputDate.value;
    if (!desc || !importance || !urgency || !dueDate) return;

    if (editIndex !== null) {
      const prevDone = tasks[editIndex].done;
      tasks[editIndex] = { desc, importance, urgency, dueDate, done: prevDone };
      editIndex = null;
      form.querySelector('button[type="submit"]').textContent = 'Add Task';
    } else {
      tasks.push({ desc, importance, urgency, dueDate, done: false });
    }

    saveTasks();
    renderTasks();
    form.reset();
  });

  // initial render
  renderTasks();
}
