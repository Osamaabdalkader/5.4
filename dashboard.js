// استيراد دوال Firebase
import { 
  auth, database, signOut,
  ref, onValue, get,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const referralsCount = document.getElementById('referrals-count');
const pointsCount = document.getElementById('points-count');
const joinDate = document.getElementById('join-date');
const referralLink = document.getElementById('referral-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const referralsList = document.getElementById('referrals-list');
const logoutBtn = document.getElementById('logout-btn');
const shareFbBtn = document.getElementById('share-fb');
const shareTwitterBtn = document.getElementById('share-twitter');
const shareWhatsappBtn = document.getElementById('share-whatsapp');

// تحميل بيانات المستخدم عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        
        loadUserData(user.uid);
    });
}

// تحميل بيانات المستخدم
function loadUserData(userId) {
    // تحميل بيانات المستخدم
    const userRef = ref(database, 'users/' + userId);
    onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // تحديث الإحصائيات
            referralsCount.textContent = userData.referralCount || 0;
            pointsCount.textContent = userData.points || 0;
            
            if (userData.createdAt) {
                const date = new Date(userData.createdAt);
                joinDate.textContent = date.toLocaleDateString('ar-SA');
            }
            
            // إنشاء رابط الإحالة
            const currentUrl = window.location.origin + window.location.pathname;
            const baseUrl = currentUrl.replace('dashboard.html', 'auth.html');
            
            if (userData.referralCode) {
                referralLink.value = `${baseUrl}?ref=${userData.referralCode}`;
            }
        }
    });
    
    // تحميل قائمة الإحالات
    const referralsRef = ref(database, `userReferrals/${userId}`);
    onValue(referralsRef, (snapshot) => {
        if (snapshot.exists()) {
            const referrals = snapshot.val();
            referralsList.innerHTML = '';
            
            Object.entries(referrals).forEach(([id, data]) => {
                const row = referralsList.insertRow();
                row.innerHTML = `
                    <td>${data.name}</td>
                    <td>${data.email}</td>
                    <td>${new Date(data.joinDate).toLocaleDateString('ar-SA')}</td>
                    <td><span style="color: green;">نشط</span></td>
                `;
            });
        } else {
            referralsList.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">لا توجد إحالات حتى الآن</td>
                </tr>
            `;
        }
    });
}

// نسخ رابط الإحالة
copyLinkBtn.addEventListener('click', () => {
    referralLink.select();
    document.execCommand('copy');
    alert('تم نسخ رابط الإحالة!');
});

// مشاركة على وسائل التواصل
shareFbBtn.addEventListener('click', shareOnFacebook);
shareTwitterBtn.addEventListener('click', shareOnTwitter);
shareWhatsappBtn.addEventListener('click', shareOnWhatsApp);

// دوال المشاركة على وسائل التواصل
function shareOnFacebook() {
    const url = encodeURIComponent(referralLink.value);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnTwitter() {
    const text = encodeURIComponent('انضم إلى هذا الموقع الرائع عبر رابط الإحالة الخاص بي!');
    const url = encodeURIComponent(referralLink.value);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

function shareOnWhatsApp() {
    const text = encodeURIComponent('انضم إلى هذا الموقع الرائع عبر رابط الإحالة الخاص بي: ');
    const url = encodeURIComponent(referralLink.value);
    window.open(`https://wa.me/?text=${text}${url}`, '_blank');
}

// تسجيل الخروج
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
        alert('حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.');
    });
});
