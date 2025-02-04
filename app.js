import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

/********************************************
 * 1. Firebase Initialization + Anonymous Auth
 ********************************************/
const firebaseConfig = {
  apiKey: "AIzaSyDC80jrgv7iC7pcgCnUsY3GqL1Nh0y9fEY",
  authDomain: "cabin-calendar-3c52f.firebaseapp.com",
  projectId: "cabin-calendar-3c52f",
  storageBucket: "cabin-calendar-3c52f.firebasestorage.app",
  messagingSenderId: "9860592954",
  appId: "1:9860592954:web:d90fbaaa47e4b4061b4c03"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore rules require request.auth != null:
const auth = getAuth(app);
signInAnonymously(auth)
  .then(() => console.log("Signed in anonymously!"))
  .catch(err => console.error("Error signing in anonymously:", err));

/********************************************
 * 2. Variables & DOM Elements
 ********************************************/
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// HTML elements
const loginPage      = document.getElementById("loginPage");
const loginBtn       = document.getElementById("loginBtn");
const calendarPage   = document.getElementById("calendarPage");
const monthNameEl    = document.getElementById("monthName");
const prevBtn        = document.getElementById("prevBtn");
const nextBtn        = document.getElementById("nextBtn");
const calendarGrid   = document.getElementById("calendarGrid");
const eventList      = document.getElementById("eventList");
const journalEntryEl = document.getElementById("journalEntry");
const journalList    = document.getElementById("journalList");
const saveJournalBtn = document.getElementById("saveJournalBtn");
const photoUpload    = document.getElementById("photoUpload");
const photoGallery   = document.getElementById("photoGallery");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");

/********************************************
 * 3. Login Logic (Simple Password)
 ********************************************/
loginBtn.addEventListener("click", () => {
  const enteredPass = document.getElementById("password").value;
  if (enteredPass === "password") {
    loginPage.style.display = "none";
    calendarPage.style.display = "block";
    renderCalendar();
    loadEvents();
    loadJournalEntries();
  } else {
    alert("Incorrect password. Please try again.");
  }
});

/********************************************
 * 4. Calendar Rendering
 ********************************************/
function renderCalendar(eventsByDate = {}) {
  monthNameEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  calendarGrid.innerHTML = "";

  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("empty-cell");
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("calendar-day");
    dayElement.textContent = day;
    dayElement.onclick = () => showAddEventModal(day); // Open modal

    const key = `${currentYear}-${currentMonth}-${day}`;
    if (eventsByDate[key]) {
      eventsByDate[key].forEach(event => {
        const eventDiv = document.createElement("div");
        eventDiv.textContent = event.name;
        eventDiv.classList.add("event-item");
        if (event.color) eventDiv.style.backgroundColor = event.color;
        dayElement.appendChild(eventDiv);
      });
    }

    calendarGrid.appendChild(dayElement);
  }
}
// Month navigation
prevBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
});

nextBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
});

/********************************************
 * 5. Firestore: Add Event (Multiple Prompts)
 ********************************************/
function showAddEventModal(day) {
  selectedDayInput.value = day;  // Store the clicked day
  eventNameInput.value = "";
  eventTimeInput.value = "";
  eventDescInput.value = "";
  eventTypeInput.value = "Open"; // Default

  addEventModal.classList.remove("hidden"); // Show modal
}

// Close modal when clicking "Cancel"
cancelEventBtn.addEventListener("click", () => {
  addEventModal.classList.add("hidden");
});

const eventTypes = {
  "Open": "",
  "Family Time": "green",
  "Family Time but open to visitors": "yellow",
  "Golf Weekend": "red",
  "Hunting": "orange",
  "Work Weekend": "blue",
  "Trout Weekend": "purple"
};

// Get event modal elements
const addEventModal = document.getElementById("addEventModal");
const selectedDayInput = document.getElementById("selectedDay");
const eventNameInput = document.getElementById("eventName");
const eventTimeInput = document.getElementById("eventTime");
const eventDescInput = document.getElementById("eventDesc");
const eventTypeInput = document.getElementById("eventType");
const saveEventBtn = document.getElementById("saveEventBtn");
const cancelEventBtn = document.getElementById("cancelEventBtn");

// Save event to Firestore when "Save Event" button is clicked
saveEventBtn.addEventListener("click", async () => {
  const eventName = eventNameInput.value.trim();
  const eventTime = eventTimeInput.value.trim();
  const eventDesc = eventDescInput.value.trim();
  const eventType = eventTypeInput.value;
  const day = selectedDayInput.value;

  if (!eventName || !eventTime || !eventDesc || !eventType || !day) {
    alert("Please fill in all fields!");
    return;
  }

  try {
    await addDoc(collection(db, "events"), {
      name: eventName,
      time: eventTime,
      description: eventDesc,
      type: eventType, // Save event type
      color: eventTypes[eventType] || "", // Assign color if valid type
      year: currentYear,
      month: currentMonth,
      day: parseInt(day, 10),
      timestamp: serverTimestamp()
    });

    addEventModal.classList.add("hidden"); // Hide modal after saving
    loadEvents(); // Reload events to reflect changes
    renderCalendar(); // Refresh calendar
  } catch (err) {
    console.error("Error saving event:", err);
  }
});

/********************************************
 * 6. Firestore: Load Events
 ********************************************/
async function loadEvents() {
  try {
    const q = query(collection(db, "events"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    
    const eventsByDate = {}; // Organize events by date

    snapshot.forEach(doc => {
      const data = doc.data();
      const key = `${data.year}-${data.month}-${data.day}`;

      if (!eventsByDate[key]) {
        eventsByDate[key] = [];
      }

      eventsByDate[key].push(data);
    });

    renderCalendar(eventsByDate);
  } catch (err) {
    console.error("Error loading events:", err);
  }
}

/********************************************
 * 7. Firestore: Journal Entries
 ********************************************/
// Prompt for three fields:
saveJournalBtn.addEventListener("click", async () => {
  // 1) Prompt for name
  const userName = prompt("Enter your name:");
  if (!userName) return;

  // 2) Prompt for date of visit
  const dateOfVisit = prompt("Enter the date of your visit (e.g., 2025-02-01):");
  if (!dateOfVisit) return;

  // 3) Prompt for journal text
  const journalText = prompt("Enter your journal entry:");
  if (!journalText) return;

  try {
    // Save to Firestore
    await addDoc(collection(db, "journalEntries"), {
      name: userName,
      visitDate: dateOfVisit,
      text: journalText,
      timestamp: serverTimestamp()
    });
    // Reload
    loadJournalEntries();
  } catch (err) {
    console.error("Error saving journal:", err);
  }
});

// Display them
async function loadJournalEntries() {
  journalList.innerHTML = "";

  try {
    // Query all, ordered by timestamp
    const q = query(collection(db, "journalEntries"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      // Display name, date, text
      li.innerHTML = `
        <strong>${data.name || "Unknown"}</strong>
        <em style="margin-left:8px;">${data.visitDate || "No date"}</em><br/>
        <p>${data.text}</p>
      `;
      journalList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading journal entries:", err);
  }
}


/********************************************
 * 8. Photo Upload (Local Browser Display)

uploadPhotoBtn.addEventListener("click", () => {
  const file = photoUpload.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    let img = document.createElement("img");
    img.src = e.target.result;
    img.classList.add("uploaded-photo");
    photoGallery.appendChild(img);
  };
  reader.readAsDataURL(file);
});
 ********************************************/
