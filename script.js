let currentSection = "anime";
let openCards = []; // Keeps track of which cards are open

function switchSection(section) {
  currentSection = section;
  document.getElementById("section-name").textContent = capitalize(section);
  document.getElementById("card-title").textContent = capitalize(section);
  openCards = []; // Reset open state
  renderItemList();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 🔧 Create dynamic episode inputs
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

// 🧾 Form submission
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

  const watched = episodesPerSeason.map(count => Array(count).fill(false));

  const reader = new FileReader();
  reader.onload = function () {
    const image = reader.result || "";

    const newItem = {
      title,
      genre,
      seasons: seasonCount,
      episodesPerSeason,
      watched,
      image
    };

    let list = JSON.parse(localStorage.getItem(currentSection)) || [];
    list.push(newItem);
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

// 🔁 Render cards
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

    const checklistDiv = document.createElement("div");
    checklistDiv.className = "episode-checklist";

    item.episodesPerSeason.forEach((count, seasonIndex) => {
      const seasonTitle = document.createElement("h4");
      seasonTitle.innerText = `Season ${seasonIndex + 1}`;
      checklistDiv.appendChild(seasonTitle);

      for (let ep = 0; ep < count; ep++) {
        const label = document.createElement("label");
        label.style = "display:inline-block; margin:3px;";
        const checkboxId = `chk-${index}-${seasonIndex}-${ep}`;

        // 🧼 Pretty checkbox + label
        label.innerHTML = `
          <input type="checkbox" id="${checkboxId}" 
            ${item.watched[seasonIndex][ep] ? "checked" : ""}
            onchange="toggleSmart('${currentSection}', ${index}, ${seasonIndex}, ${ep})">
          <label for="${checkboxId}">Ep ${ep + 1}</label>
        `;

        checklistDiv.appendChild(label);
      }
    });

    // 🧱 Card layout
    card.innerHTML = `
      <img src="${item.image || 'assets/default.jpg'}" alt="Thumbnail">
      <h3>${item.title}</h3>
      <p><strong>Genre:</strong> ${item.genre}</p>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${progressPercent}%"></div>
      </div>
      <p>${watchedCount}/${total} episodes watched (${progressPercent}%)</p>
      <button class="toggle-btn" onclick="event.stopPropagation(); toggleChecklist(${index})">
        ${openCards.includes(index) ? 'Close' : 'Open'} Checklist
      </button>
    `;

    card.appendChild(checklistDiv);
    container.appendChild(card);
  });
}

// 🎯 Smart episode toggle (select all up to current)
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

// 🧲 Toggle checklist open/close
function toggleChecklist(index) {
  const isOpen = openCards.includes(index);
  if (isOpen) {
    openCards = openCards.filter(i => i !== index);
  } else {
    openCards.push(index);
  }
  renderItemList();
}

// 🚀 Start
document.addEventListener("DOMContentLoaded", () => {
  switchSection("anime");
});
