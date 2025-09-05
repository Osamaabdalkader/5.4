// profile.js - مع نظام الإحالة
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
const referralCodeElement = document.getElementById('referral-code');
const referralLinkElement = document.getElementById('referral-link');
const referralCountElement = document.getElementById('referral-count');
const userPointsElement = document.getElementById('user-points');
const copyReferralBtn = document.getElementById('copy-referral-btn');

// تحميل بيانات المستخدم عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupEventListeners();
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

// إعداد مستمعي الأحداث
function setupEventListeners() {
    if (copyReferralBtn) {
        copyReferralBtn.addEventListener('click', copyReferralLink);
    }
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
            if (referralCodeElement && userData.referralCode) {
                referralCodeElement.textContent = userData.referralCode;
            }
            
            if (referralLinkElement && userData.referralCode) {
                const referralLink = `${window.location.origin}${window.location.pathname.replace('profile.html', 'auth.html')}?ref=${userData.referralCode}`;
                referralLinkElement.value = referralLink;
            }
            
            if (referralCountElement) {
                referralCountElement.textContent = userData.referralCount || 0;
            }
            
            if (userPointsElement) {
                userPointsElement.textContent = userData.points || 0;
            }
            
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
function copyReferralLink() {
    const referralLink = document.getElementById('referral-link').value;
    
    navigator.clipboard.writeText(referralLink).then(() => {
        alert('تم نسخ رابط الإحالة بنجاح!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('فشل في نسخ الرابط. يرجى المحاولة مرة أخرى.');
    });
}

// تسجيل الخروج
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            // توجيه إلى الصفحة الرئيسية بعد تسجيل الخروج
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
            alert('حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.');
        });
    });
              }
