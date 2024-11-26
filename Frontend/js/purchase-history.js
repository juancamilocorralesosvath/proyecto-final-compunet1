document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    try {
        const decodedToken = jwt_decode(token);
        const userId = decodedToken.id;

        const response = await fetch(`/api/orders/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const orders = await response.json();

        const purchaseHistoryContainer = document.getElementById('purchase-history');

        if (response.ok && orders.length > 0) {
            orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.classList.add('order');

                orderElement.innerHTML = `
                    <h3>Orden ID: ${order.id}</h3>
                    <p>Fecha: ${new Date(order.date).toLocaleDateString()}</p>
                    <p>Total: $${order.total.toFixed(2)}</p>
                    <h4>Productos:</h4>
                    <ul>
                        ${order.items.map(item => `<li>${item.name} - Cantidad: ${item.quantity}</li>`).join('')}
                    </ul>
                    <hr>
                `;

                purchaseHistoryContainer.appendChild(orderElement);
            });
        } else {
            purchaseHistoryContainer.innerHTML = '<p>No has realizado ninguna compra.</p>';
        }
    } catch (error) {
        console.error('Error al obtener el historial de compras:', error);
        document.getElementById('purchase-history').innerHTML = '<p>Error al cargar el historial de compras.</p>';
    }
});