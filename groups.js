// groups.js
import { 
  auth, database, ref, get, onValue,
  onAuthStateChanged
} from './firebase.js';

// عناصر DOM
const teamMembersCount = document.getElementById('team-members-count');
const teamReferralLink = document.getElementById('team-referral-link');
const teamCopyReferralBtn = document.getElementById('team-copy-referral-btn');
const teamMembersList = document.getElementById('team-members-list');

// تحميل بيانات الفريق عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// التعامل مع نسخ رابط الإحالة
teamCopyReferralBtn.addEventListener('click', () => {
    teamReferralLink.select();
    document.execCommand('copy');
    
    const originalText = teamCopyReferralBtn.innerHTML;
    teamCopyReferralBtn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
    
    setTimeout(() => {
        teamCopyReferralBtn.innerHTML = originalText;
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
        loadTeamMembers(user.uid);
    });
}

// تحميل بيانات المستخدم
async function loadUserData(userId) {
    try {
        const userRef = ref(database, 'users/' + userId);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // عرض رابط الإحالة
            if (userData.referralCode) {
                const currentUrl = window.location.origin + window.location.pathname;
                const baseUrl = currentUrl.replace('groups.html', 'auth.html');
                teamReferralLink.value = `${baseUrl}?ref=${userData.referralCode}`;
            }
        }
    } catch (error) {
        console.error("خطأ في تحميل بيانات المستخدم:", error);
    }
}

// تحميل أعضاء الفريق
async function loadTeamMembers(userId) {
    try {
        const teamRef = ref(database, 'userReferrals/' + userId);
        onValue(teamRef, (snapshot) => {
            if (snapshot.exists()) {
                const members = snapshot.val();
                const membersCount = Object.keys(members).length;
                
                // تحديث عدد الأعضاء
                teamMembersCount.textContent = membersCount;
                
                // عرض قائمة الأعضاء
                displayTeamMembers(members);
            } else {
                // لا يوجد أعضاء
                teamMembersCount.textContent = '0';
                teamMembersList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>لا يوجد أعضاء في فريقك بعد</p>
                        <p>شارك رابط الإحالة الخاص بك لبدء بناء فريقك</p>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error("خطأ في تحميل أعضاء الفريق:", error);
    }
}

// عرض أعضاء الفريق
function displayTeamMembers(members) {
    teamMembersList.innerHTML = '';
    
    Object.entries(members).forEach(([memberId, memberData]) => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        
        const joinDate = new Date(memberData.timestamp).toLocaleDateString('ar-SA');
        
        memberItem.innerHTML = `
            <div class="member-info">
                <div class="member-name">${memberData.referredUserName || 'غير معروف'}</div>
                <div class="member-email">${memberData.referredUserEmail || 'غير معروف'}</div>
                <div class="member-date">انضم في: ${joinDate}</div>
            </div>
            <div class="member-status status-active">نشط</div>
        `;
        
        teamMembersList.appendChild(memberItem);
    });
}

// إضافة أيقونة الفريق إلى footer في جميع الصفحات
function addTeamIconToFooter() {
    const footerIcons = document.querySelector('.footer-icons');
    if (footerIcons && !document.querySelector('[href="groups.html"]')) {
        const teamIcon = document.createElement('a');
        teamIcon.href = 'groups.html';
        teamIcon.className = 'icon';
        teamIcon.innerHTML = `
            <i class="fas fa-users"></i>
            <span>فريقي</span>
        `;
        footerIcons.appendChild(teamIcon);
    }
}

// إضافة أيقونة الفريق عند تحميل الصفحة
addTeamIconToFooter();
