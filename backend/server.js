
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


const usersFilePath = './users.json'
const productsFilePath = './products.json'

app.use(express.json())

/* const users = [{
    name:'john doe'
}] */

// Serve static files (CSS, JS, images) from the 'Frontend' directory
app.use(express.static(path.join(__dirname, '../Frontend')));

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

    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
    } else {
        //If header is undefined return Forbidden (403)
        res.sendStatus(403)
    }
}

// Ruta para obtener todos los usuarios
app.get('/users', (req, res) => {
    const users = readUsersFromFile()
    res.json(users)
})

app.post('/users', async (req, res) => {
    try{
        const users = readUsersFromFile()
        // entre mas grande el numero del salt mas tiempo va a tomar, pero es mas seguro
        const salt = await bcrypt.genSalt()
        // para hacer el hash, toma la contra del user y el salt que generamos
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        console.log("salt:"+salt)
        console.log("hash:"+hashedPassword)

        const user = {
            name: req.body.name,
            // bcrypt se encarga de guardar el salt dentro del hash
            password: hashedPassword,
            role: req.body.role
        }
        users.push(user)
        writeUsersToFile(users)
        res.status(201).send()
    }catch{
        res.status(500).send()
    }
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
                res.send(token)
            })
            //res.send('success!!!')
        } else{
            res.send('wrong username or password...')
        }
    } catch (error) {
        res.status(500).send('Error during login');
    }
});

// Endpoint to add a product - only accessible by admins 
app.get('/addProduct', checkToken,(req, res) => {
         //verify the JWT token generated for the user
         jwt.verify(req.token, 'supersecret', (err, authorizedData) => {
            if(err){
                console.log('ERROR:: could not connect to the protected route')
                res.sendStatus(403)
            }else{
                //If token is successfully verified, now we check if the user is an admin, if it is, it can add a new product
                req.user = authorizedData.user
                checkAdmin(req, res, () => {
                    res.sendFile(path.join(__dirname, '../Frontend/addProduct.html'));
                })
            }
         })
    
});

app.post('/addProduct', (req, res) => { 

 // Since we've already validated the user and ensured they're an admin on GET /addProduct,
 // the only thing we need to check here is that the token is valid.
    jwt.verify(req.token, 'supersecret', (err, authorizedData) => {
        if (err) {
            console.log('ERROR:: Could not verify token');
            return res.sendStatus(403);
        } else {
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
        }
    });
      
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