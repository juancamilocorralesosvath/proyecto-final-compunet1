
// server.js file

const express = require('express')
const app = express()
// para encriptar las contraseñas de los usuarios, de esa manera aunque
// alguien logre acceder a nuestra base de datos, no va a poder ver las contraseñas
// es una libreria asincrona
const bcrypt = require('bcrypt')
// para poder leer y escribir archivos JSON
const fs = require('fs')
const jwt = require('jsonwebtoken')
const path = require('path');
const cors = require('cors'); 


const usersFilePath = './users.json'
const productsFilePath = './products.json'

app.use(express.json())

/* const users = [{
    name:'john doe'
}] */

// Serve static files (CSS, JS, images) from the 'Frontend' directory
app.use(express.static(path.join(__dirname, '../Frontend')));
// Habilitar CORS para todas las solicitudes (para desarrollo)
app.use(cors());

// Middleware para verificar si la sesión está iniciada
function isAuthenticated(req, res, next) {
    if (req.session && req.session.name) {
        // Si la sesión existe, continúa al siguiente middleware o ruta
        return next();
    } else {
        // Si no hay sesión, redirige a LogIn.html
        res.sendFile(path.join(__dirname, '../Frontend/LogIn.html'));
    }
}

// Route to serve the home page (HTML file)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/dashboard.html'));
});

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
    if (!fs.existsSync(productsFilePath)) { 
        return [] 
    } 
    const productsData = fs.readFileSync(productsFilePath) 

    return JSON.parse(productsData) 
}

const writeProductsToFile = (products) => { 
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2)) 
}

// Middleware to check user roles 
const checkAdmin = (req, res, next) => { 
    const users = readUsersFromFile() 
    const user = users.find(user => user.name === req.user.name) 
    if (!user || user.role !== 'admin') { 
        return res.status(403).send('Access denied') 
    } 
    next() 
}

//Check to make sure header is not undefined, if so, return Forbidden (403)
const checkToken = (req, res, next) => {
    const header = req.headers['authorization'];
    console.log(req.headers)

    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
    } else {
        //If header is undefined return Forbidden (403)
        console.log('undefined token')
        res.sendStatus(403)

    }
}

// Ruta para obtener todos los usuarios
app.get('/users', (req, res) => {
    const users = readUsersFromFile()
    res.json(users)
})

app.post('/users/register', async (req, res) => {
    try {
        const users = await readUsersFromFile(); // Await added
        const user = users.find(user => user.name === req.body.name); // Properly declare 'user'

        if (user != null) { 
            return res.status(400).send('User already exists'); 
        }

        const salt = await bcrypt.genSalt(); // Salt generation
        const hashedPassword = await bcrypt.hash(req.body.password, salt); // Hash password

        console.log("salt:" + salt);
        console.log("hash:" + hashedPassword);

        const newUser = { // Renamed to avoid overwriting the 'user' variable
            name: req.body.name,
            password: hashedPassword,
            role: req.body.role
        };

        users.push(newUser);
        await writeUsersToFile(users); // Await added
        res.status(201).send('User created successfully');
    } catch (error) {
        console.error('Error during user registration:', error); // Log the error
        res.status(500).send('Internal server error');
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/LogIn.html'));
});
// Ruta de login de usuario
app.post('/users/login', async (req, res) => {
    const users = readUsersFromFile()
    const user = users.find(user => user.name === req.body.name)
    if (user == null){
        return res.status(400).send('user does not exists')
    }

    try {
        // usamos bcrypt para comparar
        if (await bcrypt.compare(req.body.password, user.password)){
            //if user log in success, generate a JWT token for the user with a secret key}
            jwt.sign({user}, 'supersecret', {expiresIn: '1h'}, (err, token)=> {
                if(err){
                    console.log(err)
                }
                res.status(201).send(token)
            })
        } else{
            res.send('wrong username or password...')
        }
    } catch (error) {
        res.status(500).send('Error during login');
    }
});

// Endpoint to add a product - only accessible by admins 
app.get('/addProduct', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/addProduct.html'));
});

app.post('/addProduct', checkToken, (req, res) => { 
             //verify the JWT token generated for the user
             jwt.verify(req.token, 'supersecret', (err, authorizedData) => {
                if(err){
                    console.log('ERROR:: could not connect to the protected route')
                    res.sendStatus(403)
                }else{
                    //If token is successfully verified, now we check if the user is an admin, if it is, it can add a new product
                    req.user = authorizedData.user
                    checkAdmin(req, res, () => {
                                    // Token is valid, now we add the product
                            const products = readProductsFromFile();
                            const product = {
                                id: products.length + 1,
                            name: req.body.name,
                            price: req.body.price,
                        description: req.body.desc,
                            availableQuantity: req.body.quant
                            };
                products.push(product);
                writeProductsToFile(products);

                res.status(201).send('Product successfully added!');
                    })
                }
             })
      
})

// Endpoint to remove a product - only accessible by admins 
app.delete('/products/:id', checkToken, (req, res) => { 
    jwt.verify(req.token, 'supersecret', (err, authorizedData) => { 
        if (err) { 
            console.log('ERROR:: could not connect to the protected route') 
            res.sendStatus(403) } 
        else { 
            // If token is successfully verified, now we check if the user is an admin 
            req.user = authorizedData.user 
            checkAdmin(req, res, () => { 
                const products = readProductsFromFile() 
                const productIndex = products.findIndex(p => p.id === parseInt(req.params.id)) 
                if (productIndex === -1) { 
                    return res.status(404).send('Product not found') 
                } 
                products.splice(productIndex, 1) 
                writeProductsToFile(products) 
                res.send('Product removed') }) 
            } 
        }) 
    })

// Endpoint to view products - accessible by all users 
app.get('/products', (req, res) => { 
    const products = readProductsFromFile() 
    res.json(products) 
})



app.listen(3000)