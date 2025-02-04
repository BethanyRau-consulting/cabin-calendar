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

document.addEventListener("DOMContentLoaded", function () {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  const monthNameEl = document.getElementById("monthName");
  const calendarGrid = document.getElementById("calendarGrid");
  const eventList = document.getElementById("eventList");
  const journalList = document.getElementById("journalList");
  const addEventModal = document.getElementById("addEventModal");

  const eventTypes = {
    "Open": "",
    "Family Time": "green",
    "Family Time but open to visitors": "yellow",
    "Golf Weekend": "red",
    "Hunting": "orange",
    "Work Weekend": "blue",
    "Trout Weekend": "purple"
  };

  function renderCalendar(eventsByDate = {}) {
    monthNameEl.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
    calendarGrid.innerHTML = "";
    let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.classList.add("calendar-day");
      dayElement.textContent = day;
      dayElement.onclick = () => showAddEventModal(day);
      calendarGrid.appendChild(dayElement);
    }
  }

  function showAddEventModal(day) {
    document.getElementById("eventName").value = "";
    document.getElementById("eventTime").value = "";
    document.getElementById("eventDesc").value = "";
    document.getElementById("eventType").value = "Open";
    document.getElementById("selectedDay").value = day;
    addEventModal.classList.remove("hidden");
  }

  document.getElementById("saveEventBtn").addEventListener("click", async () => {
    const eventName = document.getElementById("eventName").value;
    const eventTime = document.getElementById("eventTime").value;
    const eventDesc = document.getElementById("eventDesc").value;
    const eventType = document.getElementById("eventType").value;
    const day = document.getElementById("selectedDay").value;
    await addDoc(collection(db, "events"), {
      name: eventName,
      time: eventTime,
      description: eventDesc,
      type: eventType,
      color: eventTypes[eventType] || "",
      year: currentYear,
      month: currentMonth,
      day: parseInt(day, 10),
      timestamp: serverTimestamp()
    });
    addEventModal.classList.add("hidden");
    loadEvents();
  });

  async function loadEvents() {
    const snapshot = await getDocs(query(collection(db, "events"), orderBy("timestamp", "asc")));
    eventList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const eventItem = document.createElement("li");
      eventItem.innerHTML = `<strong>${data.name}</strong> - ${data.time} (${data.type})<br>${data.description}`;
      eventList.appendChild(eventItem);
    });
  }

  document.getElementById("saveJournalBtn").addEventListener("click", async () => {
    const journalEntry = prompt("Enter your journal entry:");
    if (journalEntry) {
      await addDoc(collection(db, "journal"), {
        entry: journalEntry,
        date: new Date().toISOString().split("T")[0],
        timestamp: serverTimestamp()
      });
      loadJournalEntries();
    }
  });

  async function loadJournalEntries() {
    const snapshot = await getDocs(query(collection(db, "journal"), orderBy("timestamp", "asc")));
    journalList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const journalItem = document.createElement("li");
      journalItem.innerHTML = `<strong>${data.date}</strong>: ${data.entry}`;
      journalList.appendChild(journalItem);
    });
  }

  renderCalendar();
  loadEvents();
  loadJournalEntries();
});

