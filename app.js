const SESSIONS_KEY = 'focus_sessions';

// Timer page
if (document.getElementById('start-btn')) {
  const circle      = document.querySelector('.progress-ring__circle');
  const radius      = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray  = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;

  let duration  = 25 * 60;
  let remaining = duration;
  let interval  = null;

  const display    = document.getElementById('timer-display');
  const slider     = document.getElementById('time-slider');
  const timerValue = document.getElementById('timer-value');
  const startBtn   = document.getElementById('start-btn');
  const pauseBtn   = document.getElementById('pause-btn');
  const resetBtn   = document.getElementById('reset-btn');
  const overlay    = document.getElementById('congrats-overlay');

  function setProgress(time) {
    const offset = circumference - (time / duration) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  function updateDisplay(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    display.textContent = `${m}:${s}`;
  }

  // init slider & display
  slider.value       = duration / 60;
  timerValue.textContent = duration / 60;
  updateDisplay(remaining);
  setProgress(remaining);

  slider.addEventListener('input', e => {
    const mins = parseInt(e.target.value, 10);
    duration  = mins * 60;
    remaining = duration;
    timerValue.textContent = mins;
    updateDisplay(remaining);
    setProgress(remaining);
  });

  startBtn.addEventListener('click', () => {
    if (interval) return;
    document.body.classList.add('running');
    startBtn.disabled = true;
    slider.disabled   = true;

    interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        interval = null;
        document.body.classList.remove('running');
        startBtn.disabled = false;
        slider.disabled   = false;

        // save session
        const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
        sessions.push({ timestamp: Date.now(), duration });
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

        overlay.classList.add('show');
        setTimeout(() => overlay.classList.remove('show'), 2000);

        remaining = duration;
      }
      updateDisplay(remaining);
      setProgress(remaining);
    }, 1000);
  });

  pauseBtn.addEventListener('click', () => {
    clearInterval(interval);
    interval = null;
    document.body.classList.remove('running');
    startBtn.disabled = false;
    slider.disabled   = false;
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(interval);
    interval = null;
    document.body.classList.remove('running');
    startBtn.disabled = false;
    slider.disabled   = false;
    remaining = duration;
    updateDisplay(remaining);
    setProgress(remaining);
  });
}

// Stats page
if (document.getElementById('today-total')) {
  const sessions     = JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
  const now          = new Date();
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek  = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let todaySec = 0, weekSec = 0, monthSec = 0;
  sessions.forEach(s => {
    const t = new Date(s.timestamp);
    if (t >= startOfDay)   todaySec += s.duration;
    if (t >= startOfWeek)  weekSec  += s.duration;
    if (t >= startOfMonth) monthSec += s.duration;
  });

  document.getElementById('today-total').textContent = Math.round(todaySec / 60);
  document.getElementById('week-total').textContent  = Math.round(weekSec  / 60);
  document.getElementById('month-total').textContent = Math.round(monthSec / 60);

  const container      = document.getElementById('tree-container');
  container.innerHTML  = '';
  sessions
    .filter(s => new Date(s.timestamp) >= startOfWeek)
    .forEach(() => {
      const div = document.createElement('div');
      div.className   = 'tree-icon';
      div.textContent = '🌳';
      container.appendChild(div);
    });
}
