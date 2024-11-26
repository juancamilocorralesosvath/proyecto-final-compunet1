document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('register-form');
    
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Usuario registrado exitosamente');
                window.location.href = 'login.html';
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert('Error de conexión');
        }
    });
});
