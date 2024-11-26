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
        if (response.ok && cart.items.length > 0) {
            const cartItemsContainer = document.getElementById('cart-items');
            cart.items.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                cartItemElement.innerHTML = `
                    <p>Producto: ${item.name}</p>
                    <p>Cantidad: ${item.quantity}</p>
                    <button class="remove-from-cart" data-item-id="${item.itemId}">Eliminar</button>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });

            const removeButtons = document.querySelectorAll('.remove-from-cart');
            removeButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    const itemId = button.getAttribute('data-item-id');
                    try {
                        const response = await fetch(`/api/carts/${userId}/items/${itemId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        const data = await response.json();
                        if (response.ok) {
                            alert('Producto eliminado del carrito');
                            location.reload();
                        } else {
                            alert(data.message);
                        }
                    } catch (error) {
                        console.error('Error al eliminar el producto:', error);
                        alert('Error al eliminar el producto');
                    }
                });
            });
        } else {
            document.getElementById('cart-items').innerHTML = '<p>Tu carrito está vacío.</p>';
        }
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        document.getElementById('cart-items').innerHTML = '<p>Error al obtener el carrito.</p>';
    }
});