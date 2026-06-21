const exerciseData = {
  walking: { label: "Walking", met: 3.5 }, running: { label: "Running", met: 8.3 },
  cycling: { label: "Cycling", met: 7.5 }, swimming: { label: "Swimming", met: 6.0 },
  yoga: { label: "Yoga", met: 2.8 }, strength: { label: "Strength training", met: 5.0 },
  dancing: { label: "Dancing", met: 5.5 }, badminton: { label: "Badminton", met: 5.5 }
};

const foodData = {
  idli: { label: "Idli", kcal: 116 }, dosa: { label: "Plain dosa", kcal: 168 },
  rice: { label: "Cooked rice", kcal: 205 }, dal: { label: "Dal", kcal: 198 },
  roti: { label: "Roti", kcal: 104 }, biryani: { label: "Vegetable biryani", kcal: 260 },
  banana: { label: "Banana", kcal: 105 }, apple: { label: "Apple", kcal: 95 },
  egg: { label: "Boiled egg", kcal: 78 }, salad: { label: "Mixed salad", kcal: 90 },
  chicken: { label: "Grilled chicken", kcal: 165 }, milk: { label: "Milk", kcal: 150 }
};

const todayKey = new Date().toISOString().slice(0, 10);
const savedState = JSON.parse(localStorage.getItem("vitatrack-state"));
const state = savedState?.date === todayKey ? savedState : {
  date: todayKey,
  burned: 0, eaten: 0, exerciseMinutes: 0, exerciseCount: 0, mealCount: 0, sleepHours: 0
};

const $ = id => document.getElementById(id);
const save = () => localStorage.setItem("vitatrack-state", JSON.stringify(state));
const animate = element => { element.classList.remove("pop"); void element.offsetWidth; element.classList.add("pop"); };

function scoreHealth() {
  const exerciseScore = Math.min(state.exerciseMinutes / 30, 1) * 35;
  const sleepScore = state.sleepHours ? Math.max(0, 1 - Math.abs(8 - state.sleepHours) / 4) * 40 : 0;
  const foodScore = state.mealCount ? 25 : 0;
  return Math.round(exerciseScore + sleepScore + foodScore);
}

function render() {
  $("burnedSummary").innerHTML = `${Math.round(state.burned)} <small>kcal</small>`;
  $("foodSummary").innerHTML = `${Math.round(state.eaten)} <small>kcal</small>`;
  $("sleepSummary").innerHTML = `${state.sleepHours ? state.sleepHours.toFixed(1) : 0} <small>hrs</small>`;
  $("exerciseSummary").textContent = state.exerciseCount ? `${state.exerciseMinutes} active minutes today` : "Add your first exercise";
  $("mealSummary").textContent = state.mealCount ? `${state.mealCount} ${state.mealCount === 1 ? "meal" : "meals"} logged today` : "Add your first meal";
  $("sleepStatus").textContent = !state.sleepHours ? "Log your sleep" : state.sleepHours >= 7 && state.sleepHours <= 9 ? "In the recommended range" : state.sleepHours < 7 ? "A little more rest may help" : "More than the usual range";
  const score = scoreHealth();
  $("scoreValue").textContent = score;
  $("scoreRing").style.strokeDashoffset = 327 - (327 * score / 100);
  updateInsights();
}

function updateInsights() {
  let title = "Ready when you are";
  let text = "Log your exercise, food, and sleep to receive a simple, personalized suggestion for your day.";
  const tips = [];
  const hasData = state.exerciseCount || state.mealCount || state.sleepHours;
  if (hasData) {
    if (state.sleepHours && state.sleepHours < 7) {
      title = "Recovery deserves the spotlight today";
      text = `You slept ${state.sleepHours.toFixed(1)} hours. Keep movement gentle, hydrate, and try moving bedtime 30–60 minutes earlier tonight.`;
    } else if (state.exerciseMinutes >= 30 && state.sleepHours >= 7 && state.mealCount) {
      title = "You’re building a beautifully balanced day";
      text = "You’ve supported all three pillars: movement, nourishment, and rest. Keep the rhythm steady—consistency is the real win.";
    } else if (!state.exerciseCount) {
      title = "A little movement could lift your day";
      text = "Even a 20-minute brisk walk can support energy and mood. Choose something you enjoy enough to repeat tomorrow.";
    } else if (!state.mealCount) {
      title = "Don’t forget to nourish the work you did";
      text = "You’ve moved today. Log a meal and aim for a mix of vegetables, protein, whole grains, and water.";
    } else {
      title = "A solid start—keep the momentum gentle";
      text = "Your health is more than a single number. Add the missing pillar when you can and focus on choices you can sustain.";
    }
  }
  if (state.exerciseMinutes < 30) tips.push(["↗", "Move a little more", `${Math.max(0, 30 - state.exerciseMinutes)} minutes to reach a simple daily activity goal.`]);
  else tips.push(["✓", "Movement goal met", `${state.exerciseMinutes} active minutes logged—nice work.`]);
  if (!state.sleepHours) tips.push(["☾", "Log last night’s sleep", "Sleep helps make your suggestions more useful."]);
  else if (state.sleepHours < 7) tips.push(["☾", "Create a wind-down", "Dim screens and lights before bed to support rest."]);
  else tips.push(["☾", "Protect your sleep", "Your rest is in a healthy general range."]);
  tips.push(["♢", "Choose balance", "Include protein, fibre, and colourful vegetables when possible."]);
  $("insightTitle").textContent = title;
  $("insightText").textContent = text;
  $("tipsGrid").innerHTML = tips.map(t => `<div class="tip"><b>${t[0]}</b><div><strong>${t[1]}</strong><span>${t[2]}</span></div></div>`).join("");
}

$("exerciseForm").addEventListener("submit", event => {
  event.preventDefault();
  const type = $("exerciseType").value;
  const minutes = Number($("exerciseMinutes").value);
  const weight = Math.max(30, Number($("weight").value) || 65);
  const calories = exerciseData[type].met * 3.5 * weight / 200 * minutes;
  state.burned += calories; state.exerciseMinutes += minutes; state.exerciseCount++;
  $("exerciseResult").innerHTML = `<span>${exerciseData[type].label.toUpperCase()} · ${minutes} MIN</span><strong>${Math.round(calories)} <small>kcal</small></strong>`;
  save(); render(); animate($("exerciseResult"));
});

$("foodForm").addEventListener("submit", event => {
  event.preventDefault();
  const type = $("foodType").value;
  const servings = Number($("servings").value);
  const calories = foodData[type].kcal * servings;
  state.eaten += calories; state.mealCount++;
  $("foodResult").innerHTML = `<span>${foodData[type].label.toUpperCase()} · ${servings} SERVING${servings === 1 ? "" : "S"}</span><strong>${Math.round(calories)} <small>kcal</small></strong>`;
  save(); render(); animate($("foodResult"));
});

$("sleepForm").addEventListener("submit", event => {
  event.preventDefault();
  const [bedH, bedM] = $("bedtime").value.split(":").map(Number);
  const [wakeH, wakeM] = $("wakeTime").value.split(":").map(Number);
  let minutes = (wakeH * 60 + wakeM) - (bedH * 60 + bedM);
  if (minutes <= 0) minutes += 24 * 60;
  state.sleepHours = minutes / 60;
  $("sleepResult").innerHTML = `<span>${$("bedtime").value} → ${$("wakeTime").value}</span><strong>${state.sleepHours.toFixed(1)} <small>hours</small></strong>`;
  save(); render(); animate($("sleepResult"));
});

$("menuButton").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => document.querySelector(".sidebar").classList.remove("open")));
$("todayLabel").textContent = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date()).toUpperCase();
render();
