// معالجة رابط الإحالة إذا كان موجودًا في URL
document.addEventListener('DOMContentLoaded', () => {
    // الانتقال إلى علامة إنشاء حساب إذا كان هناك رابط إحالة
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
        // التبديل إلى علامة إنشاء حساب
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tab="signup"]').classList.add('active');
        
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
        
        // تعبئة حقل الإحالة تلقائيًا
        document.getElementById('signup-referral').value = referralCode;
        
        // إظهار رسالة إعلامية
        const authMessage = document.getElementById('auth-message');
        authMessage.textContent = 'تم تحميل رابط الإحالة تلقائيًا';
        authMessage.className = 'success-message';
        authMessage.classList.remove('hidden');
    }
});
