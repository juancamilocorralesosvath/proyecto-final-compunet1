document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token); 
                if (email === 'admin@myapp.com') {
                    window.location.href = '/dashboard-admin.html'; 
                } else {
                    window.location.href = '/store.html';
                }
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert('Error de conexión');
        }
    });
});
