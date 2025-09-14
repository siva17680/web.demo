document.addEventListener('DOMContentLoaded', () => {
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            db.ref('users/' + user.uid).once('value').then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.role === 'student') {
                    if (userNameDisplay) {
                        userNameDisplay.textContent = `Welcome, ${userData.name || 'Student'}`;
                    }
                } else {
                    alert("Access Denied. You are not registered as a student.");
                    window.location.href = 'login.html';
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    }
});