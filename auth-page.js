// معالجة رابط الإحالة إذا كان موجودًا في URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
        // التبديل إلى علامة إنشاء حساب
        const signupTab = document.querySelector('[data-tab="signup"]');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        
        if (signupTab && loginForm && signupForm) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            signupTab.classList.add('active');
            
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            
            // تعبئة حقل الإحالة تلقائيًا
            document.getElementById('signup-referral').value = referralCode;
            
            // إظهار رسالة إعلامية
            const authMessage = document.getElementById('auth-message');
            if (authMessage) {
                authMessage.textContent = 'تم تحميل رابط الإحالة تلقائيًا';
                authMessage.className = 'success-message';
                authMessage.classList.remove('hidden');
            }
        }
    }
});
