(function(){
  const target = new Date("2026-12-25T00:00:00+05:30").getTime();
  const elements = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds")
  };
  function tick(){
    let remaining = Math.max(0, target - Date.now());
    const days = Math.floor(remaining / 86400000);
    remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000);
    remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor(remaining % 60000 / 1000);
    elements.days.textContent = String(days).padStart(3,"0");
    elements.hours.textContent = String(hours).padStart(2,"0");
    elements.minutes.textContent = String(minutes).padStart(2,"0");
    elements.seconds.textContent = String(seconds).padStart(2,"0");
  }
  tick();
  setInterval(tick,1000);
})();
