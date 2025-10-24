/* ====================== CONFIG FIREBASE ====================== */
const firebaseConfig = {
  apiKey: "AIzaSyC7V0kGz3p11sjF-FMSLW4kJ5WuZzNtLX0",
  authDomain: "cafe-pc-8a386.firebaseapp.com",
  databaseURL: "https://cafe-pc-8a386-default-rtdb.firebaseio.com",
  projectId: "cafe-pc-8a386",
  storageBucket: "cafe-pc-8a386.firebasestorage.app",
  messagingSenderId: "150129569328",
  appId: "1:150129569328:web:34c4980a7b9b3a6d1947f5",
  measurementId: "G-5HJ1Z58WXF"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
console.log("✅ Firebase initialized");

/* ====================== LOGOUT ====================== */
function logout() {
  window.location.href = "login.html";
}

/* ====================== LOAD STORES ====================== */
function loadStores() {
  const tableBody = document.querySelector('#storesTable tbody');
  db.ref('stores').on('value', snapshot => {
    tableBody.innerHTML = '';
    snapshot.forEach(child => {
      const store = child.val().info;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${child.key}</td>
        <td>${store.joinDate || '-'}</td>
        <td>${store.endDate || '-'}</td>
        <td>${store.status || 'غير معروف'}</td>
        <td>
          <button onclick="renewStore('${child.key}')">تجديد</button>
          <button onclick="deleteStore('${child.key}')">حذف</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }, error => console.error("❌ Firebase read error:", error));
}

/* ====================== ADD STORE ====================== */
function addStore() {
  const username = document.getElementById('newStoreUsername').value.trim();
  const password = document.getElementById('newStorePassword').value.trim();
  const days = parseInt(document.getElementById('newStoreDays').value);

  if (!username || !password || !days) {
    return alert("⚠️ أدخل جميع البيانات بشكل صحيح!");
  }

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  const storeRef = db.ref(`stores/${username}`);
  storeRef.once('value').then(snapshot => {
    if (snapshot.exists()) {
      alert("❌ المتجر موجود بالفعل!");
      return;
    }

    storeRef.set({
      info: {
        password,
        joinDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: "نشط"
      },
      users: {}
    })
    .then(() => {
      alert("✅ تم إضافة المتجر بنجاح!");
      document.getElementById('newStoreUsername').value = "";
      document.getElementById('newStorePassword').value = "";
      document.getElementById('newStoreDays').value = "";
    })
    .catch(err => {
      console.error("❌ خطأ أثناء الإضافة:", err);
      alert("حدث خطأ أثناء الإضافة، راجع الكونسول!");
    });
  });
}

/* ====================== RENEW & DELETE ====================== */
function renewStore(storeName) {
  const days = parseInt(prompt("أدخل عدد الأيام لتجديد الاشتراك:"));
  if (!days) return;
  const ref = db.ref(`stores/${storeName}/info`);
  ref.once('value').then(snapshot => {
    const data = snapshot.val();
    const endDate = new Date(data.endDate);
    endDate.setDate(endDate.getDate() + days);
    ref.update({ endDate: endDate.toISOString().split('T')[0], status: "نشط" });
  });
}

function deleteStore(storeName) {
  if (!confirm("هل أنت متأكد من حذف هذا المتجر؟")) return;
  db.ref(`stores/${storeName}`).remove()
    .then(() => alert("🗑️ تم حذف المتجر بنجاح"))
    .catch(err => console.error("❌ خطأ في الحذف:", err));
}

/* ====================== INIT ====================== */
loadStores();
