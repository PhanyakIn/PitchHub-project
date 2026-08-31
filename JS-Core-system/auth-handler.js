const authConfig = window.PITCHHUB_SUPABASE_CONFIG;
const authForm = document.querySelector('#auth-form');
const authMessage = document.querySelector('#auth-message');
const authSubmit = document.querySelector('.auth-submit');

const showAuthMessage = (message, isError = false) => {
    if (!authMessage) return;
    authMessage.hidden = false;
    authMessage.textContent = message;
    authMessage.classList.toggle('is-error', isError);
};

if (!authConfig?.url || !authConfig?.key) {
    showAuthMessage('กรุณาตั้งค่า Supabase URL และ key ใน supabase-config.js', true);
} else if (window.supabase && authForm) {
    const supabase = window.supabase.createClient(authConfig.url, authConfig.key);
    const isRegisterPage = window.location.pathname.endsWith('register.html');

    if (isRegisterPage) {
        const passwordInput = document.getElementById('password');
        const passwordHint = document.getElementById('password-hint');

        const validatePassword = () => {
            const val = passwordInput.value;
            if (val.length > 0 && val.length < 8) {
                passwordHint.classList.add('is-invalid');
            } else {
                passwordHint.classList.remove('is-invalid');
            }
        };
        passwordInput.addEventListener('input', validatePassword);
    }

    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        authSubmit.disabled = true;
        authSubmit.textContent = isRegisterPage ? 'กำลังสมัคร...' : 'กำลังเข้าสู่ระบบ...';

        const formData = new FormData(authForm);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        let result;

        if (isRegisterPage) {
            const firstName = formData.get('first_name').trim();
            const lastName = formData.get('last_name').trim();
            const confirmPassword = formData.get('confirm_password');

            if (password.length < 8) {
                showAuthMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', true);
                authSubmit.disabled = false;
                authSubmit.textContent = 'สมัครสมาชิก';
                return;
            }

            if (password !== confirmPassword) {
                showAuthMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน', true);
                authSubmit.disabled = false;
                authSubmit.textContent = 'สมัครสมาชิก';
                return;
            }

            result = await supabase.auth.signUp({
                email,
                password,
                options: { data: { first_name: firstName, last_name: lastName } },
            });
        } else {
            result = await supabase.auth.signInWithPassword({ email, password });
        }

        if (result.error) {
            showAuthMessage(result.error.message, true);
            authSubmit.disabled = false;
            authSubmit.textContent = isRegisterPage ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
            return;
        }

        if (isRegisterPage) {
            const fullName = `${formData.get('first_name').trim()} ${formData.get('last_name').trim()}`;
            const userId = result.data?.user?.id;

            if (userId) {
                await supabase.from('users').upsert(
                    { id: userId, fullname: fullName, email, role: 'user' },
                    { onConflict: 'id' }
                );
            }
        }

        if (isRegisterPage && !result.data.session) {
            showAuthMessage('สมัครสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ');
            authForm.reset();
        } else {
            window.location.href = 'account.html';
        }

        authSubmit.disabled = false;
        authSubmit.textContent = isRegisterPage ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
    });
}
