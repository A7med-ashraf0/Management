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

/* ====================== ADMIN PASSWORD ====================== */
const ADMIN_PASSWORD = "jokeradmin"; // ✏️ غيّرها للباسورد اللي تريده

function checkAdminPassword() {
  const input = prompt("🔐 أدخل كلمة مرور الأدمن:");
  if (input === ADMIN_PASSWORD) {
    return true;
  } else {
    alert("❌ كلمة المرور غير صحيحة!");
    return false;
  }
}

/* ====================== LOGOUT ====================== */
function logout() {
  window.location.href = "index.html";
}

/* ====================== ADD STORE ====================== */
function addStore() {
  const username = document.getElementById('newStoreUsername').value.trim();
  const password = document.getElementById('newStorePassword').value.trim();
  const days = parseInt(document.getElementById('newStoreDays').value);
  if (!username || !password || !days) return alert("⚠️ أدخل جميع البيانات!");

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  const storeRef = db.ref(`stores/${username}`);
  storeRef.once('value').then(snapshot => {
    if (snapshot.exists()) return alert("❌ المتجر موجود بالفعل!");

    storeRef.set({
      info: {
        password,
        joinDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: "نشط"
      }
    }).then(() => {
      alert("✅ تم إضافة المتجر بنجاح!");
      document.getElementById('newStoreUsername').value = "";
      document.getElementById('newStorePassword').value = "";
      document.getElementById('newStoreDays').value = "";
      loadStores();
    });
  });
}

/* ====================== LOAD STORES ====================== */
function loadStores() {
  const container = document.getElementById('storesContainer');
  container.innerHTML = "<p>⏳ جاري تحميل المتاجر...</p>";

  db.ref('stores').on('value', snapshot => {
    container.innerHTML = '';
    snapshot.forEach(child => {
      const store = child.val().info;
      if (!store) return;
      const card = document.createElement('div');
      card.className = 'store-card';
      const imgPath = "images/store.jpg";

      card.innerHTML = `
        <img src="${imgPath}" alt="store">
        <h3>${child.key}</h3>
        <p>📅 البداية: ${store.joinDate || '-'}</p>
        <p>⏰ الانتهاء: ${store.endDate || '-'}</p>
        <p>🔘 الحالة: <span class="${store.status === 'نشط' ? 'active' : 'inactive'}">${store.status}</span></p>
        <div class="actions">
          <button onclick="toggleStatus('${child.key}', '${store.status}')">
            ${store.status === 'نشط' ? 'إيقاف' : 'تشغيل'}
          </button>
          <button onclick="renewStore('${child.key}')">تجديد</button>
          <button onclick="deleteStore('${child.key}')">حذف</button>
        </div>
      `;
      container.appendChild(card);
    });
  });
}

/* ====================== TOGGLE STATUS ====================== */
function toggleStatus(storeName, currentStatus) {
  if (!checkAdminPassword()) return;
  const newStatus = currentStatus === "نشط" ? "متوقف" : "نشط";
  db.ref(`stores/${storeName}/info/status`).set(newStatus).then(() => {
    alert(`✅ تم ${newStatus === 'نشط' ? 'تشغيل' : 'إيقاف'} المتجر`);
    loadStores();
  });
}

/* ====================== RENEW STORE ====================== */
function renewStore(storeName) {
  if (!checkAdminPassword()) return;
  const days = parseInt(prompt("أدخل عدد الأيام لتجديد الاشتراك:"));
  if (!days) return;
  const ref = db.ref(`stores/${storeName}/info`);
  ref.once('value').then(snapshot => {
    const data = snapshot.val();
    const endDate = new Date(data.endDate);
    endDate.setDate(endDate.getDate() + days);
    ref.update({ endDate: endDate.toISOString().split('T')[0], status: "نشط" });
    alert("✅ تم تجديد المتجر بنجاح!");
  });
}

/* ====================== DELETE STORE ====================== */
function deleteStore(storeName) {
  if (!checkAdminPassword()) return;
  if (!confirm("⚠️ هل أنت متأكد من حذف هذا المتجر؟")) return;
  db.ref(`stores/${storeName}`).remove().then(() => {
    alert("🗑️ تم حذف المتجر بنجاح");
    loadStores();
  });
}

/* ====================== INIT ====================== */
loadStores();
