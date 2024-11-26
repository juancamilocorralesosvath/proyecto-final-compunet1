async function verifyAdminAccess() {
    const token = localStorage.getItem('token'); 

    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch('/api/admin/dashboard', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('welcome-message').innerText = data.message;
            loadProducts();
        } else {
            alert(data.message);
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error:', error); 
        alert('Error de conexión con el servidor.');
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();

        if (response.ok) {
            const productList = document.getElementById('product-list');
            productList.innerHTML = ''; 

            items.forEach(item => {
                addProductToList(item); 
            });
        } else {
            alert('No se pudieron cargar los productos: ' + (items.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error al cargar los productos:', error);
    }
}

function addProductToList(product) {
    const productList = document.getElementById('product-list');

    const productItem = document.createElement('li');
    productItem.dataset.id = product.id;
    productItem.innerHTML = `
        <strong>${product.name}</strong> - ${product.description} <br>
        Precio: $${product.price} | Stock: ${product.stock} <br>
        <img src="${product.imageUrl}" alt="${product.name}" width="100"> <br>
        <button class="delete-product">Eliminar</button>
    `;

    productItem.querySelector('.delete-product').addEventListener('click', async () => {
        await deleteProduct(product.id);
        productItem.remove();
    });

    productList.appendChild(productItem);
}

async function deleteProduct(productId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/items/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (response.ok) {
            alert('Producto eliminado exitosamente');
        } else {
            alert(data.message || 'Error al eliminar producto');
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Hubo un error al intentar eliminar el producto');
    }
}

document.getElementById('product-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const price = parseFloat(document.getElementById('price').value);
    const stock = parseInt(document.getElementById('stock').value);
    const imageFile = document.getElementById('image').files[0];

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('image', imageFile);

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            alert('Producto agregado exitosamente');
            addProductToList(data.item);
            document.getElementById('product-form').reset();
        } else {
            alert(data.message || 'Error al agregar producto');
        }
    } catch (error) {
        alert('Hubo un error al intentar agregar el producto: ' + error.message);
    }
});

verifyAdminAccess();