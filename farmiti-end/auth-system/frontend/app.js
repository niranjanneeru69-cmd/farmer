const API_URL = 'http://localhost:5001/api/auth';

const emailForm = document.getElementById('email-form');
const otpForm = document.getElementById('otp-form');
const stepEmail = document.getElementById('step-email');
const stepOtp = document.getElementById('step-otp');
const stepSuccess = document.getElementById('step-success');
const goBackBtn = document.getElementById('go-back');
const resendBtn = document.getElementById('resend-btn');
const otpInputs = document.querySelectorAll('.otp-input');
const toastContainer = document.getElementById('toast-container');

let userEmail = '';

// --- Navigation ---

function showStep(stepId) {
    [stepEmail, stepOtp, stepSuccess].forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

goBackBtn.addEventListener('click', () => {
    showStep('step-email');
});

// --- Toast Notifications ---

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- OTP Input Logic ---

otpInputs.forEach((input, index) => {
    input.addEventListener('keyup', (e) => {
        if (e.key >= 0 && e.key <= 9) {
            if (index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        } else if (e.key === 'Backspace') {
            if (index > 0) {
                otpInputs[index - 1].focus();
            }
        }
    });

    // Handle paste
    input.addEventListener('paste', (e) => {
        const data = e.clipboardData.getData('text');
        if (data.length === 6 && !isNaN(data)) {
            data.split('').forEach((char, i) => {
                otpInputs[i].value = char;
            });
            otpInputs[5].focus();
        }
    });
});

// --- API Calls ---

emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const btn = emailForm.querySelector('button');
    const btnText = btn.querySelector('span');
    const loader = btn.querySelector('.loader');

    userEmail = email;
    
    // UI Loading state
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message);
            document.getElementById('otp-description').innerText = `We've sent a 6-digit code to ${email}`;
            showStep('step-otp');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to connect to server', 'error');
    } finally {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        btn.disabled = false;
    }
});

otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showToast('Please enter the complete 6-digit code', 'error');
        return;
    }

    const btn = otpForm.querySelector('button');
    const btnText = btn.querySelector('span');
    const loader = btn.querySelector('.loader');

    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, otp })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Verification successful!');
            showStep('step-success');
        } else {
            showToast(data.message || 'Invalid code', 'error');
        }
    } catch (error) {
        showToast('Failed to verify code', 'error');
    } finally {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        btn.disabled = false;
    }
});

resendBtn.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });
        const data = await response.json();
        showToast(response.ok ? 'Code resent successfully' : data.message);
    } catch (error) {
        showToast('Failed to resend code', 'error');
    }
});
