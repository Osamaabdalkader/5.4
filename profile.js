// استيراد دوال Firebase
import { 
  auth, database, signOut,
  ref, onValue,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userPhone = document.getElementById('user-phone');
const userAddress = document.getElementById('user-address');
const logoutBtn = document.getElementById('logout-btn');
const adminIcon = document.getElementById('admin-icon');
const referralCount = document.getElementById('referral-count');
const referralLink = document.getElementById('referral-link');
const copyReferralBtn = document.getElementById('copy-referral');

// تحميل بيانات المستخدم عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, user => {
        if (!user) {
            // توجيه إلى صفحة التسجيل إذا لم يكن المستخدم مسجلاً
            window.location.href = 'auth.html';
            return;
        }
        
        // تحميل بيانات المستخدم الحالي
        loadUserData(user.uid);
    });
}

// تحميل بيانات المستخدم
function loadUserData(userId) {
    const userRef = ref(database, 'users/' + userId);
    onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // عرض بيانات المستخدم
            userName.textContent = userData.name || 'غير محدد';
            userEmail.textContent = userData.email || 'غير محدد';
            userPhone.textContent = userData.phone || 'غير محدد';
            userAddress.textContent = userData.address || 'غير محدد';
            
            // عرض معلومات الإحالة
            referralCount.textContent = userData.referralCount || 0;
            
            // إنشاء رابط الإحالة
            const currentUrl = window.location.origin + window.location.pathname;
            const baseUrl = currentUrl.replace('profile.html', 'auth.html');
            referralLink.value = `${baseUrl}?ref=${userData.referralCode}`;
            
            // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
            if (userData.isAdmin) {
                adminIcon.style.display = 'flex';
            }
        } else {
            // بيانات المستخدم غير موجودة
            userName.textContent = 'بيانات غير متاحة';
            userEmail.textContent = 'بيانات غير متاحة';
            userPhone.textContent = 'بيانات غير متاحة';
            userAddress.textContent = 'بيانات غير متاحة';
        }
    });
}

// نسخ رابط الإحالة
copyReferralBtn.addEventListener('click', () => {
    referralLink.select();
    document.execCommand('copy');
    alert('تم نسخ رابط الإحالة إلى الحافظة');
});

// تسجيل الخروج
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        // توجيه إلى الصفحة الرئيسية بعد تسجيل الخروج
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
        alert('حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.');
    });
});
