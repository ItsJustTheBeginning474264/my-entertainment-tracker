let currentSection = "anime";
let openCards = [];
let editIndex = null;

function switchSection(section) {
  currentSection = section;
  document.getElementById("section-name").textContent = capitalize(section);
  document.getElementById("card-title").textContent = capitalize(section);
  openCards = [];
  editIndex = null;

  const seasonFields = document.getElementById("seasonFields");
  const chapterField = document.getElementById("chapterField");

  if (section === "anime" || section === "series") {
    // Show season & episode inputs
    seasonFields.style.display = "block";
    chapterField.style.display = "none";
  } else if (section === "book") {
    // Show chapter input only
    seasonFields.style.display = "none";
    chapterField.style.display = "block";
  } else {
    // Movie: hide everything
    seasonFields.style.display = "none";
    chapterField.style.display = "none";
  }

  renderItemList();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Handle Season and Episode Inputs
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

  episodeInputs.forEach(input => {
    episodesPerSeason.push(parseInt(input.value));
  });

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
      newItem.seasons = 1;
      newItem.episodesPerSeason = [chapterCount];
      newItem.watched = [Array(chapterCount).fill(false)];
    } else {
      // Movie
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
    if (openCards.includes(index)) {
      card.classList.add("active");
    }

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
        <button class="toggle-btn" onclick="event.stopPropagation(); toggleChecklist(${index})">
          ${openCards.includes(index) ? '❌ Close' : '📋 Open'} Checklist
        </button>
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

        const seasonTitle = document.createElement("h4");
        seasonTitle.innerText = `Season ${seasonIndex + 1}`;

        const episodeGrid = document.createElement("div");
        episodeGrid.className = "episode-grid";

        for (let ep = 0; ep < count; ep++) {
          const checkboxId = `chk-${index}-${seasonIndex}-${ep}`;

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = checkboxId;
          checkbox.checked = item.watched[seasonIndex][ep];
          checkbox.onchange = () =>
            toggleSmart(currentSection, index, seasonIndex, ep);

          const label = document.createElement("label");
          label.setAttribute("for", checkboxId);
          label.textContent = `Ep ${ep + 1}`;

          const wrap = document.createElement("div");
          wrap.appendChild(checkbox);
          wrap.appendChild(label);

          episodeGrid.appendChild(wrap);
        }

        seasonWrap.appendChild(seasonTitle);
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
  const watchedArr = list[itemIndex].watched[seasonIndex];
  const isChecked = !watchedArr[epIndex];

  for (let i = 0; i < watchedArr.length; i++) {
    if (isChecked && i <= epIndex) {
      watchedArr[i] = true;
    } else if (!isChecked && i >= epIndex) {
      watchedArr[i] = false;
    }
  }

  localStorage.setItem(section, JSON.stringify(list));
  renderItemList();
}

function toggleChecklist(index) {
  const isOpen = openCards.includes(index);
  if (isOpen) {
    openCards = openCards.filter(i => i !== index);
  } else {
    openCards.push(index);
  }
  renderItemList();
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

document.addEventListener("DOMContentLoaded", () => {
  switchSection("anime");
  document.getElementById("itemImage").addEventListener("change", function () {
  const fileName = this.files[0]?.name || "No file chosen";
  document.getElementById("file-name").textContent = fileName;
});

});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(reg => console.log("✅ Service Worker registered"))
      .catch(err => console.error("❌ SW registration failed", err));
  });
}
