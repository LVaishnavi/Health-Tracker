const exerciseData = {
  walking: { label: "Walking", met: 3.5 }, running: { label: "Running", met: 8.3 },
  cycling: { label: "Cycling", met: 7.5 }, swimming: { label: "Swimming", met: 6 },
  yoga: { label: "Yoga", met: 2.8 }, strength: { label: "Strength training", met: 5 },
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

const $ = id => document.getElementById(id);
const now = new Date();
const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const savedState = JSON.parse(localStorage.getItem("vitatrack-state"));
const state = savedState?.date === todayKey && Array.isArray(savedState.entries)
  ? savedState
  : { date: todayKey, entries: [] };
let editingId = null;

const save = () => localStorage.setItem("vitatrack-state", JSON.stringify(state));
const animate = element => {
  element.classList.remove("pop");
  void element.offsetWidth;
  element.classList.add("pop");
};

function totals() {
  return state.entries.reduce((result, entry) => {
    if (entry.category === "exercise") {
      result.burned += entry.calories;
      result.exerciseMinutes += entry.minutes;
      result.exerciseCount++;
    } else if (entry.category === "food") {
      result.eaten += entry.calories;
      result.mealCount++;
    } else if (entry.category === "sleep") {
      result.sleepHours = entry.hours;
    }
    return result;
  }, { burned: 0, eaten: 0, exerciseMinutes: 0, exerciseCount: 0, mealCount: 0, sleepHours: 0 });
}

function scoreHealth(data) {
  const exerciseScore = Math.min(data.exerciseMinutes / 30, 1) * 35;
  const sleepScore = data.sleepHours ? Math.max(0, 1 - Math.abs(8 - data.sleepHours) / 4) * 40 : 0;
  return Math.round(exerciseScore + sleepScore + (data.mealCount ? 25 : 0));
}

function render() {
  const data = totals();
  $("burnedSummary").innerHTML = `${Math.round(data.burned)} <small>kcal</small>`;
  $("foodSummary").innerHTML = `${Math.round(data.eaten)} <small>kcal</small>`;
  $("sleepSummary").innerHTML = `${data.sleepHours ? data.sleepHours.toFixed(1) : 0} <small>hrs</small>`;
  $("exerciseSummary").textContent = data.exerciseCount ? `${data.exerciseMinutes} active minutes today` : "Add your first exercise";
  $("mealSummary").textContent = data.mealCount ? `${data.mealCount} ${data.mealCount === 1 ? "meal" : "meals"} logged today` : "Add your first meal";
  $("sleepStatus").textContent = !data.sleepHours ? "Log your sleep" : data.sleepHours >= 7 && data.sleepHours <= 9 ? "In the recommended range" : data.sleepHours < 7 ? "A little more rest may help" : "More than the usual range";
  const score = scoreHealth(data);
  $("scoreValue").textContent = score;
  $("scoreRing").style.strokeDashoffset = 327 - (327 * score / 100);
  renderActivity();
  updateRecommendations(data);
}

function renderActivity() {
  if (!state.entries.length) {
    $("activityList").innerHTML = '<div class="activity-empty">No entries yet. Your exercise, food, and sleep records will appear here.</div>';
    return;
  }
  const icons = { exercise: "E", food: "F", sleep: "S" };
  $("activityList").innerHTML = [...state.entries].reverse().map(entry => {
    const detail = entry.category === "exercise"
      ? `${entry.minutes} minutes at ${entry.weight} kg`
      : entry.category === "food"
        ? `${entry.servings} serving${entry.servings === 1 ? "" : "s"}`
        : `${entry.bedtime} to ${entry.wakeTime}`;
    const value = entry.category === "sleep" ? `${entry.hours.toFixed(1)} hours` : `${Math.round(entry.calories)} kcal`;
    return `<article class="activity-item">
      <div class="entry-icon">${icons[entry.category]}</div>
      <div class="entry-detail"><strong>${entry.label}</strong><span>${detail}</span></div>
      <div class="entry-value">${value}</div>
      <div class="entry-actions">
        <button type="button" data-action="edit" data-id="${entry.id}">Edit</button>
        <button type="button" class="delete-entry" data-action="delete" data-id="${entry.id}">Delete</button>
      </div>
    </article>`;
  }).join("");
}

function updateRecommendations(data) {
  let title = "Ready when you are";
  let text = "Log your exercise, food, and sleep to activate today's recommendation engine.";
  const tips = [];
  const hasData = data.exerciseCount || data.mealCount || data.sleepHours;

  if (hasData) {
    if (data.sleepHours && data.sleepHours < 7) {
      title = "Make recovery your priority today";
      text = `With ${data.sleepHours.toFixed(1)} hours of sleep, choose gentle movement, hydrate regularly, and aim for an earlier bedtime tonight.`;
    } else if (data.exerciseMinutes >= 30 && data.sleepHours >= 7 && data.mealCount) {
      title = "All three health pillars are in balance";
      text = "You have supported movement, nourishment, and recovery today. Maintain this rhythm instead of pushing for perfection.";
    } else if (!data.exerciseCount) {
      title = "Your best next step is movement";
      text = "Try a 20 to 30 minute walk or another activity you enjoy. A manageable action is easier to repeat tomorrow.";
    } else if (!data.mealCount) {
      title = "Support your activity with nourishment";
      text = "After moving, choose a balanced meal with protein, fibre, vegetables, and water, then log it here.";
    } else if (!data.sleepHours) {
      title = "Add sleep to complete today's picture";
      text = "Your movement and food are logged. Add last night's sleep for a more complete recommendation.";
    }
  }

  tips.push(data.exerciseMinutes < 30
    ? ["1", "Movement", `${Math.max(0, 30 - data.exerciseMinutes)} more minutes will reach today's activity goal.`]
    : ["1", "Movement goal met", `${data.exerciseMinutes} active minutes logged today.`]);
  tips.push(!data.sleepHours
    ? ["2", "Sleep", "Log your sleep to unlock recovery guidance."]
    : data.sleepHours < 7
      ? ["2", "Wind down earlier", "Reduce bright screens before bed and give yourself more recovery time."]
      : ["2", "Protect your rest", "Your sleep is within the general recommended range."]);
  tips.push(["3", "Nourishment", data.mealCount ? `${data.mealCount} meal ${data.mealCount === 1 ? "entry" : "entries"} logged. Keep portions balanced.` : "Log a meal to complete today's health picture."]);

  document.querySelector(".insight-heading h2").textContent = "Today's recommendations";
  $("insightTitle").textContent = title;
  $("insightText").textContent = text;
  $("tipsGrid").innerHTML = tips.map(t => `<div class="tip"><b>${t[0]}</b><div><strong>${t[1]}</strong><span>${t[2]}</span></div></div>`).join("");
}

function resetButtonLabels() {
  $("exerciseForm").querySelector("button").textContent = "Calculate & add";
  $("foodForm").querySelector("button").textContent = "Calculate & add";
  $("sleepForm").querySelector("button").textContent = "Calculate sleep";
}

function upsert(entry) {
  const index = state.entries.findIndex(item => item.id === editingId && item.category === entry.category);
  if (index >= 0) {
    state.entries[index] = { ...entry, id: editingId };
  } else {
    state.entries.push({ ...entry, id: `${Date.now()}-${Math.random()}` });
  }
  editingId = null;
  resetButtonLabels();
  save();
  render();
}

$("exerciseForm").addEventListener("submit", event => {
  event.preventDefault();
  const type = $("exerciseType").value;
  const minutes = Number($("exerciseMinutes").value);
  const weight = Math.max(30, Number($("weight").value) || 65);
  const calories = exerciseData[type].met * 3.5 * weight / 200 * minutes;
  upsert({ category: "exercise", type, label: exerciseData[type].label, minutes, weight, calories });
  $("exerciseResult").innerHTML = `<span>${exerciseData[type].label.toUpperCase()} - ${minutes} MIN</span><strong>${Math.round(calories)} <small>kcal</small></strong>`;
  animate($("exerciseResult"));
});

$("foodForm").addEventListener("submit", event => {
  event.preventDefault();
  const type = $("foodType").value;
  const servings = Number($("servings").value);
  const calories = foodData[type].kcal * servings;
  upsert({ category: "food", type, label: foodData[type].label, servings, calories });
  $("foodResult").innerHTML = `<span>${foodData[type].label.toUpperCase()} - ${servings} SERVING${servings === 1 ? "" : "S"}</span><strong>${Math.round(calories)} <small>kcal</small></strong>`;
  animate($("foodResult"));
});

$("sleepForm").addEventListener("submit", event => {
  event.preventDefault();
  const bedtime = $("bedtime").value;
  const wakeTime = $("wakeTime").value;
  const [bedH, bedM] = bedtime.split(":").map(Number);
  const [wakeH, wakeM] = wakeTime.split(":").map(Number);
  let minutes = (wakeH * 60 + wakeM) - (bedH * 60 + bedM);
  if (minutes <= 0) minutes += 24 * 60;
  const hours = minutes / 60;
  const editingSleep = state.entries.some(entry => entry.id === editingId && entry.category === "sleep");
  if (!editingSleep) state.entries = state.entries.filter(entry => entry.category !== "sleep");
  upsert({ category: "sleep", label: "Night sleep", bedtime, wakeTime, hours });
  $("sleepResult").innerHTML = `<span>${bedtime} TO ${wakeTime}</span><strong>${hours.toFixed(1)} <small>hours</small></strong>`;
  animate($("sleepResult"));
});

$("activityList").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const entry = state.entries.find(item => item.id === button.dataset.id);
  if (!entry) return;

  if (button.dataset.action === "delete") {
    state.entries = state.entries.filter(item => item.id !== entry.id);
    if (editingId === entry.id) editingId = null;
    resetButtonLabels();
    save(); render();
    return;
  }

  editingId = entry.id;
  if (entry.category === "exercise") {
    $("exerciseType").value = entry.type;
    $("exerciseMinutes").value = entry.minutes;
    $("weight").value = entry.weight;
    $("exerciseForm").querySelector("button").textContent = "Update exercise";
    $("exercise").scrollIntoView({ behavior: "smooth" });
  } else if (entry.category === "food") {
    $("foodType").value = entry.type;
    $("servings").value = entry.servings;
    $("foodForm").querySelector("button").textContent = "Update food";
    $("nutrition").scrollIntoView({ behavior: "smooth" });
  } else {
    $("bedtime").value = entry.bedtime;
    $("wakeTime").value = entry.wakeTime;
    $("sleepForm").querySelector("button").textContent = "Update sleep";
    $("sleep").scrollIntoView({ behavior: "smooth" });
  }
});

$("resetDay").addEventListener("click", () => {
  if (!state.entries.length || window.confirm("Remove all of today's entries?")) {
    state.entries = [];
    editingId = null;
    resetButtonLabels();
    save(); render();
  }
});

$("menuButton").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => document.querySelector(".sidebar").classList.remove("open")));
$("todayLabel").textContent = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date()).toUpperCase();
render();
