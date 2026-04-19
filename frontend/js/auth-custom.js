// ============================================================
// PlagGuard Authentication System (MongoDB Backend Integration)
// ============================================================

const API_URL = '/api/auth';
const AUTH_KEY = 'plagGuard_auth_token';
const USER_KEY = 'plagGuard_user_data';

// ---- Session Helpers ----

function setSession(user) {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify({
        email: user.email || '',
        name: user.name,
        phone: user.phone || '',
        provider: user.provider || 'email',
        joinedAt: user.joinedAt
    }));
}

function checkAuth() {
    const isLoggedIn = localStorage.getItem(AUTH_KEY) === 'true';
    const userData = JSON.parse(localStorage.getItem(USER_KEY) || '{}');

    const path = window.location.pathname.toLowerCase();
    const isLoginPage = path.endsWith('login.html');
    const isAboutPage = path.endsWith('about.html');

    if (isLoggedIn) {
        if (isLoginPage) {
            window.location.href = 'index.html';
            return;
        }
        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        updateUIForUser(userData);
    } else {
        if (!isLoginPage && !isAboutPage) {
            window.location.href = 'login.html';
            return;
        }
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.classList.remove('hidden', '!hidden');
            loginSection.style.display = 'flex';
        }
    }
}

function updateUIForUser(user) {
    const brandTitle = document.getElementById('brand-title');
    if (brandTitle && user.name) {
        brandTitle.innerHTML = `PlagGuard <span class="font-normal text-sm text-slate-500 ml-2">| Hi, ${user.name.split(' ')[0]}</span>`;
    }

    const userButtonDiv = document.getElementById('user-button');
    if (userButtonDiv) {
        userButtonDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    ${user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <button onclick="logout()" class="text-sm font-medium text-red-500 hover:text-red-700 transition">Logout</button>
            </div>
        `;
    }
}

// ---- Login / Signup Logic (API Calls) ----

async function loginWithEmail(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAuthError(data.message || 'Login failed');
            return false;
        }

        setSession(data.user);
        window.location.href = 'index.html';
        return true;
    } catch (error) {
        showAuthError('Connection error. Is the server running?');
        console.error(error);
        return false;
    }
}

async function signupWithEmail(email, password, name, phone) {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, phone })
        });

        const data = await response.json();

        if (!response.ok) {
            showAuthError(data.message || 'Signup failed');
            return false;
        }

        setSession(data.user);
        window.location.href = 'index.html';
        return true;
    } catch (error) {
        showAuthError('Connection error. Is the server running?');
        console.error(error);
        return false;
    }
}

// ---- Google Login (Simulated -> Backend) ----
window.loginWithGoogle = async function () {
    const mockEmail = prompt('Enter your Google email to simulate Google Login:');
    if (!mockEmail || !mockEmail.includes('@')) {
        showAuthError('Invalid Google email.');
        return;
    }
    const mockName = mockEmail.split('@')[0].replace(/\./g, ' ')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    try {
        const response = await fetch(`${API_URL}/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: mockEmail, name: mockName })
        });

        const data = await response.json();
        if (response.ok) {
            setSession(data.user);
            showAuthSuccess('Google login successful! Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 1200);
        } else {
            showAuthError(data.message);
        }
    } catch (error) {
        showAuthError('Backend connection failed.');
    }
};

// ---- Phone OTP Login (Simulated -> Backend) ----
let _pendingPhoneOtp = null;
let _pendingPhoneNumber = null;

window.sendOtp = function () {
    const phoneInput = document.getElementById('authPhone');
    if (!phoneInput) return;
    const phone = phoneInput.value.trim();
    if (!phone || phone.length < 10) {
        showAuthError('Please enter a valid phone number.');
        return;
    }
    _pendingPhoneNumber = phone;
    _pendingPhoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    alert(`[Demo] Your OTP is: ${_pendingPhoneOtp}\n(In real app this would be sent via SMS)`);
    
    document.getElementById('otpContainer').classList.remove('hidden');
    document.getElementById('sendOtpBtn').textContent = 'Resend OTP';
    showAuthSuccess('OTP sent! Check the alert for demo OTP.');
};

window.verifyOtp = async function () {
    const otpInput = document.getElementById('authOtp');
    if (!otpInput) return;
    const enteredOtp = otpInput.value.trim();
    if (enteredOtp !== _pendingPhoneOtp) {
        showAuthError('Incorrect OTP. Please try again.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phone: _pendingPhoneNumber, 
                name: `User${_pendingPhoneNumber.slice(-4)}` 
            })
        });

        const data = await response.json();
        if (response.ok) {
            setSession(data.user);
            showAuthSuccess('Phone verified! Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 1200);
        } else {
            showAuthError(data.message);
        }
    } catch (error) {
        showAuthError('Backend connection failed.');
    }
};

// ---- Logout ----
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
}

// ---- UI Helpers ----

function showAuthError(msg) {
    const el = document.getElementById('authMessage');
    if (el) {
        el.textContent = msg;
        el.className = 'auth-message error';
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 4000);
    }
}

function showAuthSuccess(msg) {
    const el = document.getElementById('authMessage');
    if (el) {
        el.textContent = msg;
        el.className = 'auth-message success';
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 4000);
    }
}

// ---- Auth Mode Toggle ----
let currentAuthMode = 'login'; // 'login' | 'signup'
let currentInputMethod = 'email'; // 'email' | 'phone'

window.toggleAuthMode = function () {
    currentAuthMode = currentAuthMode === 'login' ? 'signup' : 'login';
    renderAuthForm();
};

window.switchToPhone = function () {
    currentInputMethod = 'phone';
    renderAuthForm();
};

window.switchToEmail = function () {
    currentInputMethod = 'email';
    renderAuthForm();
};

function renderAuthForm() {
    const isLogin = currentAuthMode === 'login';
    const isPhone = currentInputMethod === 'phone';

    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const toggleBtn = document.getElementById('authToggleBtn');
    const toggleText = document.getElementById('authToggleText');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (title) title.textContent = isLogin ? 'Welcome back' : 'Create your account';
    if (subtitle) subtitle.textContent = isLogin ? 'Sign in to your account to continue' : 'Join PlagGuard and verify originality';
    if (toggleBtn) toggleBtn.textContent = isLogin ? 'Sign up' : 'Sign in';
    if (toggleText) toggleText.textContent = isLogin ? 'No account?' : 'Already have an account?';

    const nameField = document.getElementById('nameFieldContainer');
    if (nameField) nameField.classList.toggle('hidden', isLogin);

    const signupPhoneField = document.getElementById('signupPhoneFieldContainer');
    if (signupPhoneField) signupPhoneField.classList.toggle('hidden', isLogin);

    const emailSection = document.getElementById('emailSection');
    const phoneSection = document.getElementById('phoneSection');
    const otpContainer = document.getElementById('otpContainer');

    if (emailSection) emailSection.classList.toggle('hidden', isPhone);
    if (phoneSection) phoneSection.classList.toggle('hidden', !isPhone);
    if (otpContainer && isPhone === false) otpContainer.classList.add('hidden');

    if (submitBtn) {
        if (isPhone) {
            submitBtn.classList.add('hidden');
        } else {
            submitBtn.classList.remove('hidden');
            submitBtn.textContent = isLogin ? 'Sign in' : 'Create account';
        }
    }
}

// ---- Form Submit Handler ----
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const isLogin = currentAuthMode === 'login';
            const email = document.getElementById('authEmail')?.value?.trim();
            const password = document.getElementById('authPassword')?.value;
            const nameEl = document.getElementById('authName');
            const name = nameEl ? nameEl.value.trim() : '';
            const phoneEl = document.getElementById('authSignupPhone');
            const phone = phoneEl ? phoneEl.value.trim() : '';

            if (!email || !password) {
                showAuthError('Please fill in all fields.');
                return;
            }

            if (isLogin) {
                loginWithEmail(email, password);
            } else {
                if (name.length < 2) {
                    showAuthError('Please enter your full name.');
                    return;
                }
                if (!phone || phone.length < 10) {
                    showAuthError('Please enter a valid 10-digit phone number.');
                    return;
                }
                signupWithEmail(email, password, name, phone);
            }
        });
    }
});

window.logout = logout;
