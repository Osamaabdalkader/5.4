// استيراد دوال Firebase
import { 
  auth, database, 
  ref, onValue, query, orderByChild, equalTo,
  onAuthStateChanged, get
} from './firebase.js';

// عناصر DOM
const teamCount = document.getElementById('team-count');
const teamList = document.getElementById('team-list');
const adminIcon = document.getElementById('admin-icon');

// تحميل بيانات الفريق عند بدء التحميل
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
        
        // تحميل بيانات الفريق
        loadTeamData(user.uid);
        
        // التحقق إذا كان المستخدم مشرفاً
        checkAdminStatus(user.uid);
    });
}

// تحميل بيانات الفريق
function loadTeamData(userId) {
    // الطريقة 1: البحث عن جميع المستخدمين الذين تمت إحالتهم بواسطة هذا المستخدم
    const usersRef = ref(database, 'users');
    const userQuery = query(usersRef, orderByChild('referredBy'), equalTo(userId));
    
    onValue(userQuery, (snapshot) => {
        if (snapshot.exists()) {
            const teamMembers = snapshot.val();
            const memberCount = Object.keys(teamMembers).length;
            
            // تحديث عدد الأعضاء
            teamCount.textContent = memberCount;
            
            // عرض قائمة الأعضاء
            displayTeamMembers(teamMembers);
        } else {
            // الطريقة 2: إذا لم نجد أعضاء عبر referredBy، نبحث في teams
            loadTeamFromTeamsCollection(userId);
        }
    }, (error) => {
        console.error("Error loading team data:", error);
        // في حالة الخطأ، نستخدم الطريقة البديلة
        loadTeamFromTeamsCollection(userId);
    });
}

// تحميل الفريق من مجموعة teams
async function loadTeamFromTeamsCollection(userId) {
    try {
        const teamRef = ref(database, `teams/${userId}`);
        const snapshot = await get(teamRef);
        
        if (snapshot.exists()) {
            const teamMembers = snapshot.val();
            const memberCount = Object.keys(teamMembers).length;
            
            // تحديث عدد الأعضاء
            teamCount.textContent = memberCount;
            
            // الحصول على تفاصيل كل عضو
            const membersDetails = await getMembersDetails(Object.keys(teamMembers));
            displayTeamMembers(membersDetails);
        } else {
            // لا يوجد أعضاء في الفريق
            teamCount.textContent = '0';
            teamList.innerHTML = '<div class="no-members">لا يوجد أعضاء في فريقك بعد</div>';
        }
    } catch (error) {
        console.error("Error loading team from teams collection:", error);
        teamCount.textContent = '0';
        teamList.innerHTML = '<div class="no-members">خطأ في تحميل بيانات الفريق</div>';
    }
}

// الحصول على تفاصيل الأعضاء
async function getMembersDetails(memberIds) {
    const membersDetails = {};
    
    for (const memberId of memberIds) {
        try {
            const userRef = ref(database, `users/${memberId}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                membersDetails[memberId] = snapshot.val();
            }
        } catch (error) {
            console.error(`Error getting details for user ${memberId}:`, error);
        }
    }
    
    return membersDetails;
}

// عرض أعضاء الفريق
function displayTeamMembers(members) {
    teamList.innerHTML = '';
    
    if (!members || Object.keys(members).length === 0) {
        teamList.innerHTML = '<div class="no-members">لا يوجد أعضاء في فريقك بعد</div>';
        return;
    }
    
    for (const userId in members) {
        const member = members[userId];
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        
        memberElement.innerHTML = `
            <div class="member-info">
                <div class="member-name">${member.name || 'غير معروف'}</div>
                <div class="member-details">
                    <span class="member-email"><i class="fas fa-envelope"></i> ${member.email || 'غير متاح'}</span>
                    <span class="member-phone"><i class="fas fa-phone"></i> ${member.phone || 'غير متاح'}</span>
                </div>
            </div>
            <div class="member-join-date">
                ${formatDate(member.createdAt)}
            </div>
        `;
        
        teamList.appendChild(memberElement);
    }
}

// تنسيق التاريخ
function formatDate(timestamp) {
    if (!timestamp) return 'غير معروف';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// التحقق إذا كان المستخدم مشرفاً
function checkAdminStatus(userId) {
    const userRef = ref(database, 'users/' + userId);
    onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.isAdmin) {
                adminIcon.style.display = 'flex';
            }
        }
    });
  }
