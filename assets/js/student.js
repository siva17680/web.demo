document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-wrapper');
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // Show loader immediately on page entry
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, check their role from the database
            db.ref('users/' + user.uid).once('value').then(snapshot => {
                const userData = snapshot.val();
                
                // Check if user data exists and their role is 'student'
                if (userData && userData.role === 'student') {
                    if (userNameDisplay) {
                        userNameDisplay.textContent = `Welcome, ${userData.name || 'Student'}`;
                    }
                    // Page is authorized, hide the loader
                    if (loader) {
                        loader.style.opacity = '0';
                        setTimeout(() => { loader.style.display = 'none'; }, 500);
                    }
                    // TODO: Add functions here to load student-specific data
                } else {
                    // Not a student or role not found, redirect to login
                    alert("Access Denied. You are not registered as a student.");
                    window.location.href = 'login.html';
                }
            }).catch(error => {
                console.error("Firebase read error:", error);
                alert("Could not verify your role. Please try again.");
                window.location.href = 'login.html';
            });
        } else {
            // No user is signed in. Redirect to login page.
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