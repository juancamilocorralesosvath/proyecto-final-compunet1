
// server.js file
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')// para poder leer y escribir archivos JSON
const fs = require('fs')
const jwt = require('jsonwebtoken')
const path = require('path');
const cors = require('cors'); 
const multer = require('multer');
const PORT = 3000;


const jwtSecret = 'supersecretkey';
const saltRounds = 10;

// Serve static files (CSS, JS, images) from the 'Frontend' directory
app.use(express.static(path.join(__dirname, '../Frontend')));
// Habilitar CORS para todas las solicitudes (para desarrollo)
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(express.json());


const itemsFilePath = path.join(__dirname, 'products.json');
const cartsFilePath = path.join(__dirname, 'carts.json');
const comprasFilePath = path.join(__dirname, 'compras.json');
const usersFilePath = path.join(__dirname, 'users.json');
//


// Configuración de almacenamiento para archivos subidos.

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});


/** Instancia de Multer con configuración de almacenamiento */
const upload = multer({ storage: storage });


/**
 * Middleware para autenticar JWT.
 * Verifica token en el encabezado `Authorization` y permite acceso si es válido.
 */
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acceso no autorizado' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido o expirado' });
        }

        req.user = user;
        next();
    });
};



/**
 * Lee datos desde un archivo JSON.
 */
const readDataFromFile = (filePath) => {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
};

/**
 * Escribe datos en un archivo JSON.
 */
const writeDataToFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

let items = readDataFromFile(itemsFilePath);
let carts = readDataFromFile(cartsFilePath);
let compras = readDataFromFile(comprasFilePath);
let users = readDataFromFile(usersFilePath);
 
//Gestion de los productos------------------------------

app.get('/api/items', (req, res) => {
    res.json(items);
});

// Endpoint to add a product - only accessible by admins 
app.post('/api/items', authenticateJWT, upload.single('image'), (req, res) => {
    const { name, description, price, stock } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    if (req.user.email !== 'admin@myapp.com') {
        return res.status(403).json({ message: 'No puedes agregar productos' });
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    const newItem = {
        id: items.length > 0 ? items[items.length - 1].id + 1 : 1,
        name,
        description,
        price: priceNum,
        stock: stockNum,
        imageUrl 
    };

    items.push(newItem);
    writeDataToFile(itemsFilePath, items);
    res.status(201).json({ message: 'Producto agregado exitosamente', item: newItem });
});



// Endpoint to remove a product - only accessible by admins 
app.delete('/api/items/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const itemId = parseInt(id, 10);

    if (req.user.email !== 'admin@myapp.com') {
        return res.status(403).json({ message: 'Acceso restringido. Solo los administradores pueden eliminar productos.' });
    }

    const itemIndex = items.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
        items.splice(itemIndex, 1);
        writeDataToFile(itemsFilePath, items);
        res.status(200).json({ message: 'Item eliminado exitosamente' });
    } else {
        res.status(404).json({ message: 'Item no encontrado' });
    }
});

// Endpoint to view products - accessible by all users 
app.get('/', (req, res) => {
    // Read the products data
    fs.readFile(path.join(__dirname, 'products.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading product data');
        }
        const products = JSON.parse(data);
        // Render the dashboard page and pass the products data
        res.render('dashboard', { products: products });
    });
});




 //---------------------Gestión de usuarios---------------
const readUsersFromFile = () => {
    if(!fs.existsSync(usersFilePath)) {
        return []
    }
    const usersData = fs.readFileSync(usersFilePath)
    return JSON.parse(usersData)
}

const writeUsersToFile = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
}

const readProductsFromFile = () => { 
    if (!fs.existsSync(itemsFilePath)) { 
        return [] 
    } 
    const productsData = fs.readFileSync(itemsFilePath) 

    return JSON.parse(productsData) 
}



/**
 * Registra un nuevo usuario.
 * Permite que un usuario se registre proporcionando su nombre, correo y contraseña.
 */
app.post('/api/users', async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
        id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
        name,
        email,
        password: hashedPassword,
    };

    const newCart = {
        userId: newUser.id,
        items: []
    };

    carts.push(newCart);
    users.push(newUser);

    writeDataToFile(cartsFilePath, carts);
    writeDataToFile(usersFilePath, users);
   

    res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser });
});

/**
 * Inicia sesión de un usuario.
 * Verifica las credenciales del usuario y, si son correctas, genera un token JWT para acceso posterior.
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '1h' });
    res.json({ message: 'Login exitoso', token });
});

/**
 * Acceso al dashboard de administrador.
 * Verifica que el usuario esté autenticado y sea el administrador antes de permitir el acceso.
 */
app.get('/api/admin/dashboard', authenticateJWT, (req, res) => {
    if (req.user.email !== 'admin@myapp.com') {
        return res.status(403).json({ message: 'Acceso solo para el administrador' });
    }
    res.json({ message: 'Bienvenido al dashboard de administrador' });
});

//-----------Carrito de compras

//Agregar item al carrito
app.post('/api/carts/:userId', authenticateJWT, (req, res) => {
    const { userId } = req.params;
    const { itemId, name, price, quantity } = req.body;
    const cart = carts.find(cart => cart.userId === parseInt(userId, 10));

    if (cart) {
        const existingItem = cart.items.find(item => item.itemId === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ itemId, name, price, quantity });
        }

        writeDataToFile(cartsFilePath, carts);
        res.json({ message: 'Item agregado al carrito', cart });
    } else {
        res.status(404).json({ message: 'Carrito no encontrado' });
    }
});

//eliminar producto del carrito 
app.delete('/api/carts/:userId/items/:itemId', authenticateJWT, (req, res) => {
    const { userId, itemId } = req.params;
    const cart = carts.find(cart => cart.userId === parseInt(userId, 10));

    if (cart) {
        const itemIndex = cart.items.find(item => item.itemId === parseInt(itemId, 10));
        if (itemIndex !== -1) {
            cart.items.splice(itemIndex, 1);
            writeDataToFile(cartsFilePath, carts);
            res.json({ message: 'Item eliminado del carrito', cart });
        } else {
            res.status(404).json({ message: 'Item no encontrado en el carrito' });
        }
    } else {
        res.status(404).json({ message: 'Carrito no encontrado' });
    }
});

//obtener un carrito 
app.get('/api/carts/:userId', authenticateJWT, (req, res) => {
    const { userId } = req.params;
    const cart = carts.find(cart => cart.userId === parseInt(userId, 10));

    if (cart) {
        res.json(cart);
    } else {
        res.status(404).json({ message: 'Carrito no encontrado' });
    }
});

// Compras

app.post('/api/orders', authenticateJWT, (req, res) => {
    const userId = req.user.id; 
    const cart = carts.find(cart => cart.userId === parseInt(userId, 10));

    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío o no existe.' });
    }

  
    const total = cart.items.reduce((sum, item) => {
        const product = getProductById(item.itemId);
        if (!product) {
            return res.status(404).json({ message: `Producto con ID ${item.itemId} no encontrado.` });
        }

        if (product.stock < item.quantity) {
            return res.status(400).json({ message: `No hay suficiente stock para el producto ${product.name}.` });
        }

        return sum + (product.price * item.quantity);
    }, 0);

    
    cart.items.forEach(item => {
        const product = getProductById(item.itemId);
        product.stock -= item.quantity;
    });

    
    const newOrder = {
        userId,
        id: compras.length > 0 ? compras[compras.length - 1].id + 1 : 1,
        items: cart.items,
        total,
        date: new Date(),
    };    

    
    compras.push(newOrder);
    writeDataToFile(comprasFilePath, compras); 

    cart.items = [];
    writeDataToFile(cartsFilePath, carts); 

    res.status(201).json({ message: 'Compra realizada con éxito!', order: newOrder });
});

// Obtiene todas las órdenes de un usuario específico.

app.get('/api/orders/:userId', authenticateJWT, (req, res) => {

    const { userId } = req.params;
    const data = compras.filter(compra => compra.userId === parseInt(userId, 10));

    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ message: 'No se encontraron órdenes para este usuario.' });
    }
});

/**
 * Funcion auxiliar para retornar un producto dado su id.
 */
function getProductById(itemId) {
    return items.find(product => product.id === parseInt(itemId, 10));
}

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});