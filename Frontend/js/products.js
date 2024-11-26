

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/items')
        .then(response => response.json())
        .then(items => {
            const productList = document.getElementById('product-list');

            items.forEach(item => {
                const productElement = document.createElement('div');
                productElement.classList.add('product');

                productElement.innerHTML = `
                    <h3 id="name-${item.id}">${item.name}</h3>
                    <p>${item.description}</p>
                    <p>Precio: $${item.price}</p>
                    <input type="hidden" id="price-${item.id}" value="${item.price}">
                    <p>Stock: ${item.stock}</p>
                    <img src="${item.imageUrl}" alt="${item.name}" width="200">
                    <button class="add-to-cart" data-item-id="${item.id}">Añadir al carrito</button>
                    <div class="quantity-container" style="display: none;">
                        <label for="quantity-${item.id}">Cantidad:</label>
                        <input type="number" id="quantity-${item.id}" name="quantity" min="1" max="${item.stock}" value="1">
                        <button class="confirm-add" data-item-id="${item.id}">Confirmar</button>
                    </div>
                `;

                productList.appendChild(productElement);
            });

            const addToCartButtons = document.querySelectorAll('.add-to-cart');
            addToCartButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const itemId = button.getAttribute('data-item-id');
                    const quantityContainer = button.nextElementSibling; 

                    quantityContainer.style.display = 'block';

                    const confirmButton = quantityContainer.querySelector('.confirm-add');
                    confirmButton.addEventListener('click', () => {

                        const quantityInput = quantityContainer.querySelector(`#quantity-${itemId}`);
                        const quantity = quantityInput.value;
                        const name = document.getElementById(`name-${itemId}`).textContent;
                        const price= document.getElementById(`price-${itemId}`).value;

                        const token = localStorage.getItem('token');
                        if (token) {
                            const decodedToken = jwt_decode(token);
                            const userId = decodedToken.id;

                            fetch(`/api/carts/${userId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify({ itemId, name, price, quantity})
                            })
                            .then(response => response.json())
                            .then(data => {
                                alert(`Producto agregado al carrito`);
                            })
                            .catch(error => {
                                console.error('Error al agregar al carrito:', error);
                            });
                        }

                        quantityContainer.style.display = 'none';
                    });

                    
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar los productos:', error);
            document.getElementById('product-list').innerHTML = '<p>Error al cargar los productos.</p>';
        });
});
