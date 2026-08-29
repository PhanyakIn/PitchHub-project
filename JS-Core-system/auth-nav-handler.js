const authNavConfig = window.PITCHHUB_SUPABASE_CONFIG;

if (authNavConfig?.url && authNavConfig?.key && window.supabase) {
	const authNavSupabase = window.supabase.createClient(authNavConfig.url, authNavConfig.key);

	const renderNavAccount = (user) => {
		document.querySelectorAll('nav a[href="login.html"]').forEach((link) => {
			link.href = user ? 'account.html' : 'login.html';
			link.classList.toggle('active', user && window.location.pathname.endsWith('account.html'));

			const node = document.createElement('span');
			if (user) {
				node.className = 'nav-account-avatar';
				const firstName = (user.user_metadata?.first_name || '').trim();
				node.textContent = (firstName[0] || '').toUpperCase() || '?';
			} else {
				node.className = 'nav-account-icon';
				node.innerHTML = '<i class="fa-regular fa-circle-user"></i>';
			}
			link.replaceChildren(node);
		});
	};

	const updateAdminLink = async (user) => {
		document.querySelectorAll('.admin-only').forEach(el => {
			el.style.display = 'none';
		});

		if (user) {
			const { data } = await authNavSupabase
				.from('users')
				.select('role')
				.eq('email', user.email)
				.maybeSingle();

			if (data?.role === 'admin') {
				document.querySelectorAll('.admin-only').forEach(el => {
					el.style.display = '';
				});
			}
		}
	};

	const updateAuthLinks = async () => {
		const { data: { user } } = await authNavSupabase.auth.getUser();
		renderNavAccount(user);
		updateAdminLink(user);
	};

	updateAuthLinks();
	authNavSupabase.auth.onAuthStateChange((_, session) => {
		renderNavAccount(session?.user);
		updateAdminLink(session?.user);
	});
}
