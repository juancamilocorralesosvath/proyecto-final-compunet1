document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    
    try {
        const decodedToken = jwt_decode(token);
        const userId = decodedToken.id;

        const response = await fetch(`/api/carts/${userId}`, { 
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const cart = await response.json();

        const purchaseSummary = document.getElementById('purchase-summary');

        if (response.ok && cart.items.length > 0) {

            const total = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            purchaseSummary.innerHTML = `
                <h2>Resumen de la Compra</h2>
                <ul id="cart-items-summary">
                    ${cart.items.map(item => `
                        <li>${item.name} - Cantidad: ${item.quantity} - Subtotal: $${(item.price * item.quantity).toFixed(2)}</li>
                    `).join('')}
                </ul>
                <p><strong>Total: $${total.toFixed(2)}</strong></p>
            `;
        } else {
            purchaseSummary.innerHTML = '<p>Tu carrito está vacío.</p>';
        }

        document.getElementById('confirm-purchase').addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            try {

                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
        
                const result = await response.json();
                if (response.ok) {
                    alert('Compra realizada exitosamente!');
                    location.href = 'store.html';
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Error al realizar la compra:', error);
                alert('Error al realizar la compra');
            }
        });        

    } catch (error) {
        console.error('Error al obtener el carrito:', error);
    }
});