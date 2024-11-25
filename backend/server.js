const express = require('express')
const app = express()
// para encriptar las contraseñas de los usuarios, de esa manera aunque
// alguien logre acceder a nuestra base de datos, no va a poder ver las contraseñas
// es una libreria asincrona
const bcrypt = require('bcrypt')

app.use(express.json())

const users = [{
    name:'john doe'
}]

app.get('/users', (req, res) => {
    res.json(users)
})

app.post('/users', async (req, res) => {
    try{
        // entre mas grande el numero del salt mas tiempo va a tomar, pero es mas seguro
        const salt = await bcrypt.genSalt()
        // para hacer el hash, toma la contra del user y el salt que generamos
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        console.log("salt:"+salt)
        console.log("hash:"+hashedPassword)

        const user = {
            name: req.body.name,
            // bcrypt se encarga de guardar el salt dentro del hash
            password: hashedPassword
        }
        users.push(user)
        res.status(201).send()
    }catch{
        res.status(500).send()
    }
})

app.post('/users/login', async (req, res) => {
    const user = users.find(user => user.name === req.body.name)
    if (user == null){
        return res.status(400).send('user does not exists')
    }

    try {
        // usamos bcrypt para comparar
        if (await bcrypt.compare(req.body.password, user.password)){
            res.send('success!!!')
        } else{
            res.send('wrong username or password...')
        }
    } catch (error) {
        res.status(500).send(error)
    }
})

// Ruta para servir el archivo HTML (index.html)
app.get('/', (req, res) => {
    // Enviar el archivo index.html al cliente cuando acceda a la raíz
    res.sendFile(__dirname + '/Frontend/index.html');  // Asegúrate de que el archivo esté en la misma carpeta que server.js
});

app.listen(3000)