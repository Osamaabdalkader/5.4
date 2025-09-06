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
    
    // تغيير نص الزر مؤقتاً للإشارة إلى نجاح النسخ
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
    onValue(userRef, async (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // عرض بيانات المستخدم
            userName.textContent = userData.name || 'غير محدد';
            userEmail.textContent = userData.email || 'غير محدد';
            userPhone.textContent = userData.phone || 'غير محدد';
            userAddress.textContent = userData.address || 'غير محدد';
            
            // عرض عدد الإحالات - نستخدم البيانات المباشرة من المستخدم
            userReferrals.textContent = userData.referralsCount || 0;
            
            // إنشاء وعرض رابط الإحالة
            if (userData.referralCode) {
                const currentUrl = window.location.origin + window.location.pathname;
                const baseUrl = currentUrl.replace('profile.html', 'auth.html');
                referralLink.value = `${baseUrl}?ref=${userData.referralCode}`;
            }
            
            // إظهار أيقونة الإدارة إذا كان المستخدم مشرفاً
            if (userData.isAdmin) {
                adminIcon.style.display = 'flex';
            }
            
            // تحميل قائمة المستخدمين الذين تمت إحالتهم (اختياري)
            await loadReferralsList(userId);
        } else {
            // بيانات المستخدم غير موجودة
            userName.textContent = 'بيانات غير متاحة';
            userEmail.textContent = 'بيانات غير متاحة';
            userPhone.textContent = 'بيانات غير متاحة';
            userAddress.textContent = 'بيانات غير متاحة';
            userReferrals.textContent = '0';
        }
    });
}

// تحميل قائمة المستخدمين الذين تمت إحالتهم (وظيفة إضافية)
async function loadReferralsList(userId) {
    try {
        const referralsRef = ref(database, 'userReferrals/' + userId);
        const snapshot = await get(referralsRef);
        
        if (snapshot.exists()) {
            const referrals = snapshot.val();
            const referralsCount = Object.keys(referrals).length;
            console.log("عدد المستخدمين الذين تمت إحالتهم: ", referralsCount);
            
            // تحديث العدد إذا كان مختلفاً عن القيمة المخزنة
            if (referralsCount !== (parseInt(userReferrals.textContent) || 0)) {
                userReferrals.textContent = referralsCount;
                
                // تحديث القيمة في قاعدة البيانات للحفاظ على التزامن
                await set(ref(database, 'users/' + userId + '/referralsCount'), referralsCount);
            }
        }
    } catch (error) {
        console.error("خطأ في تحميل قائمة الإحالات: ", error);
    }
}

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
