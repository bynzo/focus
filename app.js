// app.js

// --- Force full page reload on nav clicks so styles.css is re-applied ---
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && href.endsWith('.html') && !link.classList.contains('active')) {
        e.preventDefault();
        window.location.href = href;
      }
    });
  });
});

const FOCUS_KEY = 'focus_sessions';

// --- audio beep ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
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

// --- Wake Lock helpers ---
let wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => console.log('Wake Lock released'));
      console.log('Wake Lock acquired');
    }
  } catch (err) {
    console.warn('Wake Lock error:', err);
  }
}
function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().then(() => { wakeLock = null; });
  }
}

// --- Timer page logic ---
if (document.getElementById('start-btn')) {
  const circle = document.querySelector('.progress-ring__circle');
  const r      = circle.r.baseVal.value;
  const C      = 2 * Math.PI * r;
  circle.style.strokeDasharray  = `${C} ${C}`;
  circle.style.strokeDashoffset = C;

  let duration  = 25 * 60,   // seconds
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
    circle.style.strokeDashoffset = C - (t / duration) * C;
  }

  function updDisp(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    disp.textContent = `${m}:${s}`;
  }

  function recordFocus() {
    const arr = JSON.parse(localStorage.getItem(FOCUS_KEY)) || [];
    arr.push({ timestamp: Date.now(), duration });
    localStorage.setItem(FOCUS_KEY, JSON.stringify(arr));
  }

  function startTimer(breakMode = false) {
    isBreak = breakMode;
    document.body.classList.toggle('break', breakMode);
    document.body.classList.toggle('running', !breakMode);

    // Disable start/slider/break; enable pause/reset
    startBtn.disabled = true;
    slider.disabled   = true;
    breakBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;

    // calculate end time
    const endTime = Date.now() + remaining * 1000;
    requestWakeLock();

    interval = setInterval(() => {
      remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      updDisp(remaining);
      setProg(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        releaseWakeLock();
        // reset UI
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;
        slider.disabled   = false;
        breakBtn.disabled = false;
        document.body.classList.remove('running', 'break');
        if (!isBreak) recordFocus();
        showOverlay(isBreak);
        // reset counters
        duration  = parseInt(slider.value, 10) * 60;
        remaining = duration;
        updDisp(remaining);
        setProg(remaining);
      }
    }, 1000);
  }

  // initialize
  slider.value   = duration / 60;
  tv.textContent = duration / 60;
  updDisp(remaining);
  setProg(remaining);

  pauseBtn.disabled = true;
  resetBtn.disabled = true;

  slider.addEventListener('input', e => {
    duration  = parseInt(e.target.value, 10) * 60;
    remaining = duration;
    tv.textContent = parseInt(e.target.value, 10);
    updDisp(remaining);
    setProg(remaining);
  });

  startBtn.addEventListener('click', () => startTimer(false));
  pauseBtn.addEventListener('click', () => {
    clearInterval(interval);
    releaseWakeLock();
    // re-enable start/slider/break; keep reset enabled
    startBtn.disabled = false;
    slider.disabled   = false;
    breakBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    document.body.classList.remove('running', 'break');
  });
  resetBtn.addEventListener('click', () => {
    clearInterval(interval);
    releaseWakeLock();
    // restore initial UI
    remaining = duration;
    updDisp(remaining);
    setProg(remaining);
    startBtn.disabled = false;
    slider.disabled   = false;
    breakBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    document.body.classList.remove('running', 'break');
  });
  breakBtn.addEventListener('click', () => {
    duration  = parseInt(breakSel.value, 10) * 60;
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
  const sow = new Date(sod); sow.setDate(sow.getDate() - sod.getDay());
  const som = new Date(now.getFullYear(), now.getMonth(), 1);

  let d = 0, w = 0, m = 0;
  arr.forEach(s => {
    const t = new Date(s.timestamp);
    if (t >= sod) d += s.duration;
    if (t >= sow) w += s.duration;
    if (t >= som) m += s.duration;
  });

  const toMin = sec => Math.round(sec / 60);
  document.getElementById('today-total').textContent = toMin(d);
  document.getElementById('week-total').textContent  = toMin(w);
  document.getElementById('month-total').textContent = toMin(m);

  const treeCt = document.getElementById('tree-container');
  treeCt.innerHTML = '';
  arr.filter(s => new Date(s.timestamp) >= sow).forEach(() => {
    const div = document.createElement('div');
    div.className   = 'tree-icon';
    div.textContent = '🌳';
    treeCt.appendChild(div);
  });
}

// --- To-Do List logic with swipe actions ---
if (document.getElementById('todo-form')) {
  const TODO_KEY  = 'todo_tasks';
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

      // swipe wrapper
      const content = document.createElement('div');
      content.className = 'swipe-content';

      // checkbox
      const cb = document.createElement('input');
      cb.type    = 'checkbox';
      cb.checked = task.done;
      cb.addEventListener('change', () => {
        task.done = cb.checked;
        saveTasks();
        li.classList.toggle('done', task.done);
      });
      content.appendChild(cb);

      // description
      const desc = document.createElement('span');
      desc.className   = 'task-desc';
      desc.textContent = task.desc;
      content.appendChild(desc);

      // importance & urgency icons + due date
      const icons    = document.createElement('div');
      icons.className = 'task-icons';
      const iconsRow = document.createElement('div');
      iconsRow.className = 'icons-row';
      const impIcon = document.createElement('span');
      impIcon.className   = 'imp-icon';
      impIcon.textContent = task.importance === 'high' ? '⭐' : '☆';
      const urgIcon = document.createElement('span');
      urgIcon.className   = 'urg-icon';
      urgIcon.textContent = task.urgency === 'high' ? '⚠️' : '⏰';
      iconsRow.append(impIcon, urgIcon);
      icons.appendChild(iconsRow);
      const due = document.createElement('span');
      due.className   = 'due-text';
      due.textContent = task.dueDate;
      icons.appendChild(due);
      content.appendChild(icons);

      li.appendChild(content);
      listEl.appendChild(li);

      // swipe gestures
      let startX = 0;
      content.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
      });
      content.addEventListener('touchmove', e => {
        const dx = e.touches[0].clientX - startX;
        content.style.transform = `translateX(${dx}px)`;
        li.classList.toggle('show-edit', dx > 0);
        li.classList.toggle('show-delete', dx < 0);
        e.preventDefault();
      }, { passive: false });
      content.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        content.style.transition = 'transform 0.2s';
        if (dx > 100) {
          content.style.transform = 'translateX(0)';
          li.classList.remove('show-edit');
          inputDesc.value = task.desc;
          selectImp.value = task.importance;
          selectUrg.value = task.urgency;
          inputDate.value = task.dueDate;
          editIndex = i;
          form.querySelector('button[type="submit"]').textContent = 'Save';
          window.scrollTo({ top: form.offsetTop - 20, behavior: 'smooth' });
        } else if (dx < -100) {
          tasks.splice(i, 1);
          saveTasks();
          renderTasks();
          return;
        } else {
          content.style.transform = 'translateX(0)';
          li.classList.remove('show-edit', 'show-delete');
        }
        setTimeout(() => { content.style.transition = ''; }, 200);
      });
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
