const firebaseConfig = {
  apiKey: "AIzaSyB7NavJ88lttFO3Sq674VtFErGCNc-XGpg",
  authDomain: "builderjournal-243dc.firebaseapp.com",
  projectId: "builderjournal-243dc",
  storageBucket: "builderjournal-243dc.appspot.com",
  messagingSenderId: "879101091469",
  appId: "1:879101091469:web:c1049377a07bd8d7768cc4",
  measurementId: "G-FCTG2TJ2Y5"
};

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
      snapshot.forEach(doc => {
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

        // Create a wrapper for the buttons
        const btnGroup = document.createElement("div");
        btnGroup.className = "buttons";
        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(delBtn);

        // Append text and button group to the entry
        li.appendChild(btnGroup);
        list.appendChild(li);

      });
    })
    .catch(error => {
      console.error("Error loading entries:", error);
    });
}

// Handle Auth State
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
