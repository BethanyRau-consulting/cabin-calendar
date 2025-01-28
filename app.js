// app.js
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
  // Replace with your config from Firebase console
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefg12345"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sign in anonymously (if using request.auth != null)
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

// Elements
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

// Modal elements
const addEventModal      = document.getElementById("addEventModal");
const selectedDayInput   = document.getElementById("selectedDay");
const eventNameInput     = document.getElementById("eventName");
const eventTimeInput     = document.getElementById("eventTime");
const eventDescInput     = document.getElementById("eventDesc");
const saveEventBtn       = document.getElementById("saveEventBtn");
const cancelEventBtn     = document.getElementById("cancelEventBtn");

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
function renderCalendar() {
  monthNameEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  calendarGrid.innerHTML = "";

  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Add empty cells for offset
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("empty-cell");
    calendarGrid.appendChild(emptyCell);
  }

  // Create day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div");
    dayElement.textContent = day;
    dayElement.classList.add("calendar-day");
    dayElement.onclick = () => showAddEventModal(day); // Instead of addEvent
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
 * 5. Show Modal, Save Event
 ********************************************/
function showAddEventModal(day) {
  // Clear any previous input
  eventNameInput.value = "";
  eventTimeInput.value = "";
  eventDescInput.value = "";
  // Store the clicked day
  selectedDayInput.value = day;

  // Show the modal
  addEventModal.classList.remove("hidden");
}

cancelEventBtn.addEventListener("click", () => {
  // Hide the modal
  addEventModal.classList.add("hidden");
});

saveEventBtn.addEventListener("click", async () => {
  const eventName = eventNameInput.value.trim();
  const eventTime = eventTimeInput.value.trim();
  const eventDesc = eventDescInput.value.trim();
  const day = selectedDayInput.value;

  if (!eventName || !eventTime || !eventDesc || !day) {
    alert("Please fill in all fields!");
    return;
  }

  try {
    await addDoc(collection(db, "events"), {
      name: eventName,
      time: eventTime,
      description: eventDesc,
      year: currentYear,
      month: currentMonth,
      day: parseInt(day, 10),
      timestamp: serverTimestamp()
    });
    // Hide modal
    addEventModal.classList.add("hidden");
    // Reload events
    loadEvents();
  } catch (err) {
    console.error("Error saving event:", err);
  }
});

/********************************************
 * 6. Firestore: Events
 ********************************************/
async function loadEvents() {
  eventList.innerHTML = "";

  try {
    // Query all events, ordered by timestamp
    const q = query(collection(db, "events"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${data.name}</strong> 
        <em>${data.time}</em><br/>
        <small>${monthNames[data.month]} ${data.day}, ${data.year}</small><br/>
        <p>${data.description}</p>
      `;
      eventList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading events:", err);
  }
}

/********************************************
 * 7. Firestore: Journal Entries
 ********************************************/
saveJournalBtn.addEventListener("click", async () => {
  const entryText = journalEntryEl.value.trim();
  if (!entryText) return;
  try {
    await addDoc(collection(db, "journalEntries"), {
      text: entryText,
      timestamp: serverTimestamp()
    });
    journalEntryEl.value = "";
    loadJournalEntries();
  } catch (err) {
    console.error("Error saving journal:", err);
  }
});

async function loadJournalEntries() {
  journalList.innerHTML = "";

  try {
    const q = query(collection(db, "journalEntries"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = data.text;
      journalList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading journal entries:", err);
  }
}

/********************************************
 * 8. Photo Upload (Local Browser Display)
 ********************************************/
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
