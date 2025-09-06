// استيراد دوال Firebase
import { 
  auth, database, ref, set, get,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged 
} from './firebase.js';

// عناصر DOM
const authTabs = document.querySelector('.auth-tabs');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

// تغيير علامات التوثيق
authTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        if (e.target.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
        
        // إخفاء أي رسائل سابقة
        authMessage.classList.add('hidden');
    }
});

// إنشاء رمز إحالة فريد للمستخدم
function generateReferralCode() {
    // إنشاء رمز عشوائي مكون من 10 أحرف
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// البحث عن المستخدم باستخدام رمز الإحالة
async function findUserByReferralCode(referralCode) {
    if (!referralCode) return null;
    
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (const userId in users) {
                if (users[userId].referralCode === referralCode) {
                    return userId; // إرجاع معرف المستخدم الذي يملك رمز الإحالة
                }
            }
        }
        return null; // لم يتم العثور على رمز الإحالة
    } catch (error) {
        console.error('Error checking referral code:', error);
        return null;
    }
}

// تسجيل الدخول
loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAuthMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        showAuthMessage('تم تسجيل الدخول بنجاح!', 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد تسجيل الدخول
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showAuthMessage(getAuthErrorMessage(error.code), 'error');
    }
});

// إنشاء حساب
signupBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const address = document.getElementById('signup-address').value;
    const referralCodeInput = document.getElementById('referral-code').value;
    
    if (!name || !phone || !email || !password) {
        showAuthMessage('يرجى ملء جميع الحقول الإلزامية', 'error');
        return;
    }
    
    try {
        // التحقق من صحة رابط الإحالة إذا تم إدخاله
        let referredByUserId = null;
        if (referralCodeInput) {
            referredByUserId = await findUserByReferralCode(referralCodeInput);
            if (!referredByUserId) {
                showAuthMessage('رمز الإحالة غير صحيح', 'error');
                return;
            }
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // إنشاء رمز إحالة للمستخدم الجديد
        const referralCode = generateReferralCode();
        
        // حفظ بيانات المستخدم الإضافية في قاعدة البيانات
        const userData = {
            name: name,
            phone: phone,
            email: email,
            address: address,
            createdAt: Date.now(),
            isAdmin: false,
            referralCode: referralCode,
            referredBy: referredByUserId, // حفظ معرف المستخدم الذي أحاله
            referralsCount: 0
        };
        
        await set(ref(database, 'users/' + user.uid), userData);
        
        // إذا كان المستخدم قد انضم عن طريق رابط إحالة، زيادة عداد الإحالات للمستخدم المُحيل
        if (referredByUserId) {
            try {
                const referrerRef = ref(database, 'users/' + referredByUserId);
                const referrerSnapshot = await get(referrerRef);
                
                if (referrerSnapshot.exists()) {
                    const referrerData = referrerSnapshot.val();
                    const updatedCount = (referrerData.referralsCount || 0) + 1;
                    
                    // تحديث عداد الإحالات للمستخدم المُحيل
                    await set(ref(database, 'users/' + referredByUserId + '/referralsCount'), updatedCount);
                    
                    // تسجيل تفاصيل الإحالة في مسار منفصل
                    const referralData = {
                        referredUserId: user.uid,
                        referredUserName: name,
                        timestamp: Date.now()
                    };
                    
                    await set(ref(database, 'userReferrals/' + referredByUserId + '/' + user.uid), referralData);
                    
                    console.log("تم تحديث عداد الإحالات للمستخدم: ", referredByUserId);
                }
            } catch (error) {
                console.error("خطأ في تحديث عداد الإحالات: ", error);
            }
        }
        
        showAuthMessage('تم إنشاء الحساب بنجاح!', 'success');
        
        // الانتقال إلى الصفحة الرئيسية بعد إنشاء الحساب
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showAuthMessage(getAuthErrorMessage(error.code), 'error');
    }
});

// استمع لتغير حالة المستخدم
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('auth.html')) {
        // إذا كان المستخدم مسجلاً بالفعل، انتقل إلى الصفحة الرئيسية
        window.location.href = 'index.html';
    }
});

// وظائف مساعدة
function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = '';
    authMessage.classList.add(type + '-message');
    authMessage.classList.remove('hidden');
}

function getAuthErrorMessage(code) {
    switch(code) {
        case 'auth/invalid-email': return 'البريد الإلكتروني غير صالح';
        case 'auth/user-disabled': return 'هذا الحساب معطل';
        case 'auth/user-not-found': return 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني';
        case 'auth/wrong-password': return 'كلمة المرور غير صحيحة';
        case 'auth/email-already-in-use': return 'هذا البريد الإلكتروني مستخدم بالفعل';
        case 'auth/weak-password': return 'كلمة المرور ضعيفة (يجب أن تحتوي على 6 أحرف على الأقل)';
        default: return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
    }
}

// معالجة رابط الإحالة إذا كان موجودًا في URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
        document.getElementById('referral-code').value = refCode;
        
        // إظهار نموذج إنشاء الحساب تلقائيًا إذا كان هناك رابط إحالة
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="signup"]').classList.add('active');
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
});
