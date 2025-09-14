document.addEventListener('DOMContentLoaded', () => {
    // Ensure this script only runs on pages where these elements exist
    const loginFormContainer = document.getElementById('login-form-container');
    if (!loginFormContainer) return; // Exit if not on the login page

    // --- DOM Elements ---
    const loader = document.getElementById('loader-wrapper');
    const signupFormContainer = document.getElementById('signup-form-container');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error-message');
    const signupForm = document.getElementById('signup-form');
    const signupName = document.getElementById('signup-name');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirmPassword = document.getElementById('signup-confirm-password');
    const signupRole = document.getElementById('signup-role');
    const signupError = document.getElementById('signup-error-message');
    const googleSignInBtn = document.getElementById('google-signin-btn');

    // --- Utility Functions ---
    const showLoader = () => loader.style.display = 'flex';
    const hideLoader = () => loader.style.display = 'none';

    const setValidationMessage = (element, message, type) => {
        const messageElement = element.nextElementSibling;
        if (messageElement && messageElement.classList.contains('validation-message')) {
            messageElement.textContent = message;
            messageElement.className = `validation-message ${type}`;
            element.classList.toggle('valid', type === 'success');
            element.classList.toggle('invalid', type === 'error');
        }
    };

    // --- Role-Based Redirection ---
    const redirectUser = (uid) => {
        db.ref('users/' + uid).once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData && userData.role) {
                switch (userData.role) {
                    case 'admin': window.location.href = 'admin-dashboard.html'; break;
                    case 'instructor': window.location.href = 'instructor-dashboard.html'; break;
                    case 'student': window.location.href = 'student-dashboard.html'; break;
                    default: window.location.href = 'student-dashboard.html';
                }
            } else { // First time Google Sign-In, default to student
                const newUser = {
                    name: auth.currentUser.displayName,
                    email: auth.currentUser.email,
                    role: 'student',
                    createdAt: new Date().toISOString()
                };
                db.ref('users/' + uid).set(newUser)
                    .then(() => window.location.href = 'student-dashboard.html');
            }
        }).catch(err => {
            console.error(err);
            loginError.textContent = "Could not verify user role.";
            hideLoader();
        });
    };

    // --- Form Toggling ---
    showSignupLink.addEventListener('click', (e) => { e.preventDefault(); loginFormContainer.style.display = 'none'; signupFormContainer.style.display = 'block'; });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); signupFormContainer.style.display = 'none'; loginFormContainer.style.display = 'block'; });

    // --- Realtime Validation ---
    signupEmail.addEventListener('input', () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(signupEmail.value)) setValidationMessage(signupEmail, 'Email is valid.', 'success');
        else setValidationMessage(signupEmail, 'Please enter a valid email.', 'error');
    });
    signupPassword.addEventListener('input', () => {
        if (signupPassword.value.length >= 8) setValidationMessage(signupPassword, 'Password is strong enough.', 'success');
        else setValidationMessage(signupPassword, 'Password must be at least 8 characters.', 'error');
    });
    signupConfirmPassword.addEventListener('input', () => {
        if (signupConfirmPassword.value === signupPassword.value && signupConfirmPassword.value.length > 0) setValidationMessage(signupConfirmPassword, 'Passwords match.', 'success');
        else setValidationMessage(signupConfirmPassword, 'Passwords do not match.', 'error');
    });

    // --- Event Listeners ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showLoader();
        auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
            .then(userCredential => redirectUser(userCredential.user.uid))
            .catch(error => { loginError.textContent = error.message; hideLoader(); });
    });
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signupError.textContent = '';
        if (signupPassword.value !== signupConfirmPassword.value) { signupError.textContent = "Passwords do not match."; return; }
        if (signupRole.value === "") { signupError.textContent = "Please select a role."; return; }
        showLoader();
        auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value)
            .then(userCredential => {
                const user = userCredential.user;
                const userData = { name: signupName.value, email: user.email, role: signupRole.value, createdAt: new Date().toISOString() };
                return db.ref('users/' + user.uid).set(userData).then(() => redirectUser(user.uid));
            })
            .catch(error => { signupError.textContent = error.message; hideLoader(); });
    });
    googleSignInBtn.addEventListener('click', () => {
        showLoader();
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(result => redirectUser(result.user.uid))
            .catch(error => { loginError.textContent = error.message; hideLoader(); });
    });
});