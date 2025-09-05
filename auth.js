// auth.js - مع نظام الإحالة
import { 
  auth, database, ref, set, update, increment, query, orderByChild, equalTo, onValue,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged 
} from './firebase.js';

// عناصر DOM
const authTabs = document.querySelector('.auth-tabs');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

// الحصول على رمز الإحالة من URL
function getReferralCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
}

// إنشاء رمز إحالة فريد based on timestamp
function generateReferralCode() {
    const timestamp = Date.now().toString(36); // تحويل التاريخ إلى base36
    const randomStr = Math.random().toString(36).substring(2, 6); // 4 حروف عشوائية
    return (timestamp + randomStr).toUpperCase().substring(0, 10); // Limiting to 10 characters
}

// التحقق من وجود العناصر قبل إضافة المستمعين
if (authTabs && loginForm && signupForm && authMessage && loginBtn && signupBtn) {
    // التحقق من وجود رمز إحالة في URL
    const urlReferralCode = getReferralCodeFromURL();
    if (urlReferralCode) {
        // تعبئة حقل الإحالة تلقائياً إذا كان موجوداً في الرابط
        const referralInput = document.getElementById('signup-referral');
        if (referralInput) {
            referralInput.value = urlReferralCode;
            showAuthMessage('تم اكتشاف رمز إحالة في الرابط!', 'success');
        }
    }

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
            console.error('Login error:', error);
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
        const referralCode = document.getElementById('signup-referral').value;
        
        if (!name || !phone || !email || !password) {
            showAuthMessage('يرجى ملء جميع الحقول الإلزامية', 'error');
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // إنشاء رمز إحالة للمستخدم الجديد
            const userReferralCode = generateReferralCode();
            
            // حفظ بيانات المستخدم الإضافية في قاعدة البيانات
            const userData = {
                name: name,
                phone: phone,
                email: email,
                address: address,
                referralCode: userReferralCode,
                referredBy: referralCode || '',
                referralCount: 0,
                points: 0,
                createdAt: Date.now(),
                isAdmin: false
            };
            
            await set(ref(database, 'users/' + user.uid), userData);
            
            // إذا كان هناك رمز إحالة، تحديث إحصائيات المُحيل
            if (referralCode) {
                await updateReferralStats(referralCode, user.uid);
            }
            
            showAuthMessage('تم إنشاء الحساب بنجاح!', 'success');
            
            // الانتقال إلى الصفحة الرئيسية بعد إنشاء الحساب
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Signup error:', error);
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
} else {
    console.error('One or more auth elements not found');
}

// تحديث إحصائيات المُحيل
async function updateReferralStats(referralCode, newUserId) {
    try {
        // البحث عن المستخدم باستخدام رمز الإحالة
        const usersRef = ref(database, 'users');
        const queryRef = query(usersRef, orderByChild('referralCode'), equalTo(referralCode));
        
        const snapshot = await new Promise((resolve) => {
            onValue(queryRef, (snapshot) => resolve(snapshot), { onlyOnce: true });
        });
        
        if (snapshot.exists()) {
            let referrerId = null;
            let referrerData = null;
            
            snapshot.forEach((childSnapshot) => {
                referrerId = childSnapshot.key;
                referrerData = childSnapshot.val();
            });
            
            if (referrerId) {
                // تحديث إحصائيات المُحيل
                const updates = {};
                updates[`users/${referrerId}/referralCount`] = increment(1);
                updates[`users/${referrerId}/points`] = increment(100); // 100 نقطة لكل إحالة
                
                // حفظ علاقة الإحالة
                updates[`referrals/${referrerId}/${newUserId}`] = {
                    referredAt: Date.now(),
                    status: 'active'
                };
                
                await update(ref(database), updates);
                
                console.log('تم تحديث إحصائيات الإحالة بنجاح');
            }
        } else {
            console.log('لم يتم العثور على مستخدم برمز الإحالة هذا');
        }
    } catch (error) {
        console.error('Error updating referral stats:', error);
    }
}

// وظائف مساعدة
function showAuthMessage(message, type) {
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = '';
        authMessage.classList.add(type + '-message');
        authMessage.classList.remove('hidden');
    }
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
