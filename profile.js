// استيراد دوال Firebase
import { 
  auth, database, signOut,
  ref, onValue, get,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userPhone = document.getElementById('user-phone');
const userAddress = document.getElementById('user-address');
const userReferrals = document.getElementById('user-referrals');
const referralLink = document.getElementById('referral-link');
const copyReferralBtn = document.getElementById('copy-referral-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminIcon = document.getElementById('admin-icon');

// تحميل بيانات المستخدم عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// التعامل مع نسخ رابط الإحالة
copyReferralBtn.addEventListener('click', () => {
    referralLink.select();
    document.execCommand('copy');
    
    const originalText = copyReferralBtn.innerHTML;
    copyReferralBtn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
    
    setTimeout(() => {
        copyReferralBtn.innerHTML = originalText;
    }, 2000);
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, user => {
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        
        loadUserData(user.uid);
    });
}

// تحميل بيانات المستخدم
function loadUserData(userId) {
    const userRef = ref(database, 'users/' + userId);
    onValue(userRef, async (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            userName.textContent = userData.name || 'غير محدد';
            userEmail.textContent = userData.email || 'غير محدد';
            userPhone.textContent = userData.phone || 'غير محدد';
            userAddress.textContent = userData.address || 'غير محدد';
            
            // تحميل عدد الإحالات الحقيقي من المسار المنفصل
            await loadActualReferralsCount(userId, userData);
            
            if (userData.referralCode) {
                const currentUrl = window.location.origin + window.location.pathname;
                const baseUrl = currentUrl.replace('profile.html', 'auth.html');
                referralLink.value = `${baseUrl}?ref=${userData.referralCode}`;
            }
            
            if (userData.isAdmin) {
                adminIcon.style.display = 'flex';
            }
        } else {
            userName.textContent = 'بيانات غير متاحة';
            userEmail.textContent = 'بيانات غير متاحة';
            userPhone.textContent = 'بيانات غير متاحة';
            userAddress.textContent = 'بيانات غير متاحة';
            userReferrals.textContent = '0';
        }
    });
}

// تحميل عدد الإحالات الحقيقي من المسار المنفصل
async function loadActualReferralsCount(userId, userData) {
    try {
        const referralsRef = ref(database, 'userReferrals/' + userId);
        const snapshot = await get(referralsRef);
        
        let actualCount = 0;
        if (snapshot.exists()) {
            const referrals = snapshot.val();
            actualCount = Object.keys(referrals).length;
            
            // مزامنة العدد مع الحقل في userData إذا كان مختلفًا
            if (actualCount !== (userData.referralsCount || 0)) {
                await set(ref(database, 'users/' + userId + '/referralsCount'), actualCount);
            }
        }
        
        userReferrals.textContent = actualCount;
    } catch (error) {
        console.error("خطأ في تحميل عدد الإحالات: ", error);
        userReferrals.textContent = userData.referralsCount || 0;
    }
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
