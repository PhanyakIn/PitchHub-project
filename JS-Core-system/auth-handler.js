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
