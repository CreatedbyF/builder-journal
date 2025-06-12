import { firebaseConfig } from "./firebase-config.js";


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;

// LOGIN / SIGNUP
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Account created and signed in.");
    })
    .catch(error => {
      if (error.code === "auth/email-already-in-use") {
        firebase.auth().signInWithEmailAndPassword(email, password)
          .then(() => {
            console.log("Signed in successfully.");
          })
          .catch(err => {
            alert("Login failed: " + err.message);
          });
      } else {
        alert("Signup failed: " + error.message);
      }
    });
}

function logout() {
  auth.signOut();
}

function saveEntry() {
  const text = document.getElementById("entryInput").value;
  if (text.trim() === "" || !currentUser) return;

  db.collection("journal").add({
    text: text,
    createdAt: new Date(),
    userId: currentUser.uid
  }).then(() => {
    document.getElementById("entryInput").value = "";
    loadEntries();
  }).catch(error => {
    alert("⚠️ Failed to save entry. Please try again.");
    console.error("Error saving entry:", error);
  });
}

function deleteEntry(id) {
  db.collection("journal").doc(id).delete()
    .then(() => {
      loadEntries();
    })
    .catch(error => {
      console.error("Error deleting entry:", error);
    });
}

function editEntry(id, oldText) {
  const newText = prompt("Edit your entry:", oldText);
  if (!newText || newText.trim() === "") return;

  db.collection("journal").doc(id).update({
    text: newText,
    editedAt: new Date()
  }).then(() => {
    loadEntries();
  }).catch(error => {
    console.error("Error editing entry:", error);
  });
}

function loadEntries() {
  if (!currentUser) return;

  const list = document.getElementById("entriesList");
  list.innerHTML = "";

  db.collection("journal")
    .where("userId", "==", currentUser.uid)
    .orderBy("createdAt", "desc")
    .get()
    .then(snapshot => {
      let hasEntries = false;

      snapshot.forEach(doc => {
        hasEntries = true;

        const data = doc.data();
        const timestamp = data.createdAt?.toDate?.();
        const formattedDate = timestamp ? timestamp.toLocaleString() : "No date";

        const li = document.createElement("li");
        li.textContent = `${data.text} 📅 ${formattedDate}`;

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.style.marginLeft = "10px";
        editBtn.onclick = () => editEntry(doc.id, data.text);

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️";
        delBtn.style.marginLeft = "10px";
        delBtn.onclick = () => deleteEntry(doc.id);

        const btnGroup = document.createElement("div");
        btnGroup.className = "buttons";
        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(delBtn);

        li.appendChild(btnGroup);
        list.appendChild(li);
      });

      if (!hasEntries) {
        const emptyMsg = document.createElement("li");
        emptyMsg.textContent = "🗒️ No journal entries yet. Start writing!";
        list.appendChild(emptyMsg);
      }
    })
    .catch(error => {
      console.error("Error loading entries:", error);
    });
}

auth.onAuthStateChanged(user => {
  currentUser = user;

  const authSection = document.getElementById("auth-section");
  const logoutBtn = document.getElementById("logoutBtn");
  const saveBtn = document.getElementById("saveBtn");

  if (user) {
    console.log("User signed in:", user.email);
    authSection.style.display = "none";
    logoutBtn.style.display = "inline-block";
    saveBtn.disabled = false;
    loadEntries();
  } else {
    console.log("User signed out");
    authSection.style.display = "block";
    logoutBtn.style.display = "none";
    saveBtn.disabled = true;
    document.getElementById("entriesList").innerHTML = "";
  }
});
