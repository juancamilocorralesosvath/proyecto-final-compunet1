const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.json());

// Simulando una base de datos
const users = [{
    name: 'john doe',
    password: '$2b$10$4KOYUsQcfghyN1hnHjL13.Yt1XlAoWiMvs6ZTtL2dx8w5gPlXGlvC', // password hasheada de ejemplo
}];

// Ruta para obtener todos los usuarios
app.get('/users', (req, res) => {
    res.json(users);
});

// Ruta de registro de usuario
app.post('/users/register', async (req, res) => {
    const { name, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = users.find(user => user.name === name);
    if (existingUser) {
        return res.status(400).send('User already exists');
    }

    try {
        // Generar salt y hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear el nuevo usuario
        const user = {
            name,
            password: hashedPassword,
        };

        // Guardar el usuario en la "base de datos"
        users.push(user);
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

// Ruta de login de usuario
app.post('/users/login', async (req, res) => {
    const { name, password } = req.body;

    // Buscar al usuario en la "base de datos"
    const user = users.find(user => user.name === name);
    if (!user) {
        return res.status(400).send('User does not exist');
    }

    try {
        // Verificar la contraseña
        if (await bcrypt.compare(password, user.password)) {
            // Generar un token JWT
            const token = jwt.sign({ name: user.name }, 'your_jwt_secret', { expiresIn: '1h' });
            res.status(200).json({ message: 'Login successful', token });
        } else {
            res.status(400).send('Wrong username or password');
        }
    } catch (error) {
        res.status(500).send('Error during login');
    }
});

// Servir archivos estáticos desde la carpeta 'Frontend'
app.use(express.static(path.join(__dirname, '../Frontend')));

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/LogIn.html'));
});

// Puerto donde corre el servidor
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
