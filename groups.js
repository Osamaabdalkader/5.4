// استيراد دوال Firebase
import { 
  auth, database, 
  ref, onValue, get,
  onAuthStateChanged
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
            window.location.href = 'auth.html';
            return;
        }
        
        loadTeamData(user.uid);
        checkAdminStatus(user.uid);
    });
}

// تحميل بيانات الفريق من شجرة الإحالة
function loadTeamData(userId) {
    const teamRef = ref(database, `referralTree/${userId}`);
    
    onValue(teamRef, async (snapshot) => {
        if (snapshot.exists()) {
            const teamMembers = snapshot.val();
            const memberIds = Object.keys(teamMembers);
            const memberCount = memberIds.length;
            
            teamCount.textContent = memberCount;
            
            // الحصول على تفاصيل الأعضاء
            const membersDetails = await getMembersDetails(memberIds);
            displayTeamMembers(membersDetails);
        } else {
            teamCount.textContent = '0';
            teamList.innerHTML = '<div class="no-members">لا يوجد أعضاء في فريقك بعد</div>';
        }
    }, (error) => {
        console.error("Error loading team data:", error);
        teamCount.textContent = '0';
        teamList.innerHTML = '<div class="no-members">خطأ في تحميل بيانات الفريق</div>';
    });
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
