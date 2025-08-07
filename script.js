let currentSection = "anime";
let openCards = [];
let editIndex = null;
let calendar;
function switchSection(section) {
  currentSection = section;
  document.getElementById("section-name").textContent = capitalize(section);
  document.getElementById("card-title").textContent = capitalize(section);
  openCards = [];
  editIndex = null;

  const seasonFields = document.getElementById("seasonFields");
  const chapterField = document.getElementById("chapterField");

  if (section === "anime" || section === "series") {
    seasonFields.style.display = "block";
    chapterField.style.display = "none";
  } else if (section === "book") {
    seasonFields.style.display = "none";
    chapterField.style.display = "block";
  } else {
    seasonFields.style.display = "none";
    chapterField.style.display = "none";
  }

  renderItemList();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.getElementById("seasonCount").addEventListener("input", function () {
  const container = document.getElementById("episodesContainer");
  container.innerHTML = "";
  const seasonCount = parseInt(this.value);
  if (isNaN(seasonCount) || seasonCount < 1) return;

  for (let i = 1; i <= seasonCount; i++) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.placeholder = `Episodes in Season ${i}`;
    input.className = "episode-count";
    input.required = true;
    container.appendChild(input);
  }
});

document.getElementById("itemForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("itemTitle").value;
  const genre = document.getElementById("itemGenre").value;
  const seasonCount = parseInt(document.getElementById("seasonCount").value);
  const episodeInputs = document.querySelectorAll(".episode-count");
  const fileInput = document.getElementById("itemImage");
  const file = fileInput.files[0];
  const episodesPerSeason = [];

  episodeInputs.forEach(input => episodesPerSeason.push(parseInt(input.value)));

  const reader = new FileReader();
  reader.onload = function () {
    const image = reader.result || "";
    const list = JSON.parse(localStorage.getItem(currentSection)) || [];

    const newItem = {
      title,
      genre,
      image,
    };

    if (currentSection === "anime" || currentSection === "series") {
      newItem.seasons = seasonCount;
      newItem.episodesPerSeason = episodesPerSeason;
      newItem.watched = episodesPerSeason.map(count => Array(count).fill(false));
    } else if (currentSection === "book") {
      const chapterCount = parseInt(document.getElementById("chapterCount").value) || 1;
      newItem.seasons = 1;
      newItem.episodesPerSeason = [chapterCount];
      newItem.watched = [Array(chapterCount).fill(false)];
    } else {
      newItem.seasons = 1;
      newItem.episodesPerSeason = [1];
      newItem.watched = [[false]];
    }

    if (editIndex !== null) {
      const originalWatched = list[editIndex].watched;
      newItem.watched = originalWatched.length === newItem.episodesPerSeason.length
        ? originalWatched
        : episodesPerSeason.map(count => Array(count).fill(false));
      newItem.image = image || list[editIndex].image;
      list[editIndex] = newItem;
      editIndex = null;
    } else {
      list.push(newItem);
    }

    localStorage.setItem(currentSection, JSON.stringify(list));
    document.getElementById("itemForm").reset();
    document.getElementById("episodesContainer").innerHTML = "";
    renderItemList();
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    reader.onload();
  }
});

function renderItemList() {
  const container = document.getElementById("itemList");
  container.innerHTML = "";
  const list = JSON.parse(localStorage.getItem(currentSection)) || [];

  list.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";
    if (openCards.includes(index)) card.classList.add("active");

    const total = item.episodesPerSeason.reduce((a, b) => a + b, 0);
    const watchedCount = item.watched.flat().filter(Boolean).length;
    const progressPercent = Math.round((watchedCount / total) * 100);

    card.innerHTML = `
      <img src="${item.image || 'assets/default.jpg'}" alt="Thumbnail">
      <h3>${item.title}</h3>
      <p><strong>Genre:</strong> ${item.genre}</p>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${progressPercent}%"></div>
      </div>
      <p>${watchedCount}/${total} episodes watched (${progressPercent}%)</p>
      <div class="button-group">
        <button class="toggle-btn" onclick="event.stopPropagation(); toggleChecklist(${index})">${openCards.includes(index) ? '❌ Close' : '📋 Open'} Checklist</button>
        <button class="edit-btn" onclick="editItem(${index})">✏️ Edit</button>
        <button class="delete-btn" onclick="deleteItem(${index})">🗑️ Delete</button>
      </div>
    `;

    if (openCards.includes(index)) {
      const checklistDiv = document.createElement("div");
      checklistDiv.className = "episode-checklist";

      item.episodesPerSeason.forEach((count, seasonIndex) => {
        const seasonWrap = document.createElement("div");
        seasonWrap.className = "episode-checklist-season";
        seasonWrap.innerHTML = `<h4>Season ${seasonIndex + 1}</h4>`;

        const episodeGrid = document.createElement("div");
        episodeGrid.className = "episode-grid";

        for (let ep = 0; ep < count; ep++) {
          const checkboxId = `chk-${index}-${seasonIndex}-${ep}`;
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = checkboxId;
          checkbox.checked = item.watched[seasonIndex][ep];
          checkbox.onchange = () => toggleSmart(currentSection, index, seasonIndex, ep);

          const label = document.createElement("label");
          label.setAttribute("for", checkboxId);
          label.textContent = `Ep ${ep + 1}`;

          const wrap = document.createElement("div");
          wrap.appendChild(checkbox);
          wrap.appendChild(label);
          episodeGrid.appendChild(wrap);
        }

        seasonWrap.appendChild(episodeGrid);
        checklistDiv.appendChild(seasonWrap);
      });

      card.appendChild(checklistDiv);
    }

    container.appendChild(card);
  });
}

function toggleSmart(section, itemIndex, seasonIndex, epIndex) {
  const list = JSON.parse(localStorage.getItem(section));
  const item = list[itemIndex];
  const watchedArr = item.watched[seasonIndex];
  const isChecked = !watchedArr[epIndex];

  for (let i = 0; i < watchedArr.length; i++) {
    if (isChecked && i <= epIndex) {
      if (!watchedArr[i]) {
        watchedArr[i] = true;
        logWatchedItem(item.title, section, `S${seasonIndex + 1}E${i + 1}`);
      }
    } else if (!isChecked && i >= epIndex) {
      if (watchedArr[i]) {
        watchedArr[i] = false;
        removeWatchedItem(item.title, section, `S${seasonIndex + 1}E${i + 1}`);
      }
    }
  }


  function removeWatchedItem(title, type, epOrChapter) {
  let log = JSON.parse(localStorage.getItem('watchedLog')) || [];

  log = log.filter(entry => {
    return !(
      entry.title === title &&
      entry.type === type &&
      (entry.ep === epOrChapter || `Ch. ${entry.chapter}` === epOrChapter)
    );
  });

  localStorage.setItem('watchedLog', JSON.stringify(log));
}


  localStorage.setItem(section, JSON.stringify(list));
  renderItemList();
  updateCalendar();
}


function logWatchedItem(title, type, epOrChapter) {
  let log = JSON.parse(localStorage.getItem('watchedLog')) || [];

  log.push({
    title: title,
    type: type,
    ep: epOrChapter.includes("Ch") ? null : epOrChapter,
    chapter: epOrChapter.includes("Ch") ? epOrChapter.split(" ")[1] : null,
    date: new Date().toISOString().split("T")[0]
  });

  localStorage.setItem('watchedLog', JSON.stringify(log));
}
function updateCalendar() {
  const events = getWatchedEventsFromLocalStorage();
  calendar.removeAllEvents();
  events.forEach(event => calendar.addEvent(event));
}



function getWatchedEventsFromLocalStorage() {
  let log = JSON.parse(localStorage.getItem('watchedLog')) || [];
  return log.map(entry => ({
    title: `${entry.title} ${entry.ep || "Ch. " + entry.chapter}`,
    start: entry.date
  }));
}

function deleteItem(index) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  const list = JSON.parse(localStorage.getItem(currentSection));
  list.splice(index, 1);
  localStorage.setItem(currentSection, JSON.stringify(list));
  renderItemList();
}

function editItem(index) {
  const list = JSON.parse(localStorage.getItem(currentSection));
  const item = list[index];

  document.getElementById("itemTitle").value = item.title;
  document.getElementById("itemGenre").value = item.genre;
  document.getElementById("seasonCount").value = item.seasons;

  const container = document.getElementById("episodesContainer");
  container.innerHTML = "";
  item.episodesPerSeason.forEach((epCount, i) => {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.value = epCount;
    input.className = "episode-count";
    container.appendChild(input);
  });

  editIndex = index;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleChecklist(index) {
  const isOpen = openCards.includes(index);
  openCards = isOpen ? openCards.filter(i => i !== index) : [...openCards, index];
  renderItemList();
}
document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  if (calendarEl) {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: getWatchedEventsFromLocalStorage()
    });
    calendar.render();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  switchSection("anime");

  document.getElementById("itemImage").addEventListener("change", function () {
    const fileName = this.files[0]?.name || "No file chosen";
    document.getElementById("file-name").textContent = fileName;
  });

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: getWatchedEventsFromLocalStorage()
  });
  calendar.render();
});

// 🌟 PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(reg => console.log("✅ Service Worker registered"))
      .catch(err => console.error("❌ SW registration failed", err));
  });
}
