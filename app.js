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
// Replace with your actual Firebase config from the console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef12345"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// If your Firestore rules require request.auth != null:
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
    dayElement.onclick = () => addEvent(day); // Use multiple prompts
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
async function addEvent(day) {
  const eventName = prompt("Enter the event name:");
  if (!eventName) return; // Cancel if user hits Esc or doesn't enter a name

  const eventTime = prompt("Enter the event time (e.g., 2:00 PM):");
  if (!eventTime) return;

  const eventDesc = prompt("Enter a short description of the event:");
  if (!eventDesc) return;

  try {
    await addDoc(collection(db, "events"), {
      name: eventName,
      time: eventTime,
      description: eventDesc,
      year: currentYear,
      month: currentMonth,
      day: day,
      timestamp: serverTimestamp()
    });
    loadEvents(); // Refresh the list after adding
  } catch (err) {
    console.error("Error adding event:", err);
  }
}

/********************************************
 * 6. Firestore: Load Events
 ********************************************/
async function loadEvents() {
  eventList.innerHTML = "";

  try {
    // Query all events, ordered by newest first
    const q = query(collection(db, "events"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${data.name}</strong> 
        <em style="margin-left:8px;">${data.time}</em><br/>
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
