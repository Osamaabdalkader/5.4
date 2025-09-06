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
        console.log("بيانات المستخدم:", snapshot.val()); // لأغراض debugging
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
            
            // التأكد من وجود كود الإحالة
            if (userData.referralCode) {
                referralLink.value = `${baseUrl}?ref=${userData.referralCode}`;
            } else {
                // إذا لم يكن هناك كود إحالة، إنشاء واحد
                const newReferralCode = generateReferralCode(userId);
                referralLink.value = `${baseUrl}?ref=${newReferralCode}`;
                
                // حفظ الكود الجديد في قاعدة البيانات
                set(ref(database, `users/${userId}/referralCode`), newReferralCode)
                    .catch(error => console.error("Error saving referral code:", error));
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
            
            // محاولة إنشاء بيانات أساسية للمستخدم
            createBasicUserData(userId);
        }
    }, (error) => {
        console.error("Error loading user data:", error);
    });
}

// إنشاء كود إحالة فريد (نفس الدالة في auth.js)
function generateReferralCode(uid) {
    const timestamp = Date.now().toString(36);
    const uidPart = uid.substring(0, 5);
    return `REF_${timestamp}_${uidPart}`.toUpperCase();
}

// إنشاء بيانات أساسية للمستخدم إذا لم تكن موجودة
async function createBasicUserData(userId) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        // الحصول على معلومات المستخدم من authentication
        const userData = {
            name: user.displayName || "مستخدم جديد",
            email: user.email || "غير محدد",
            phone: "غير محدد",
            address: "غير محدد",
            createdAt: Date.now(),
            isAdmin: false,
            referralCode: generateReferralCode(userId),
            referralCount: 0,
            referredBy: null
        };
        
        await set(ref(database, 'users/' + userId), userData);
        console.log("تم إنشاء بيانات المستخدم الأساسية");
        
        // إعادة تحميل البيانات
        loadUserData(userId);
    } catch (error) {
        console.error("Error creating basic user data:", error);
    }
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
