//SETUP//
let express = require('express')
require('dotenv').config()
let app = express()
//CORS
const cors = require('cors')
app.use(cors())
//PORT
const port = 3000
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
//BODYPARSER
let bodyParser = require('body-parser')
midware = bodyParser.urlencoded({extended: false})
app.use(bodyParser.json());
//BCRYPT
const bcrypt = require('bcrypt');

//DATABASE//
const mongoose = require('mongoose')
const {Schema} = mongoose;
mongoose.connect(process.env.MONGO_URI)

//AUTH//
const jwt = require("jsonwebtoken")







/////////////////////////BLOG/////////////////////////
const paragraphSchema = new Schema({
    title: String, // String is shorthand for {type: String}
    author: String,
    content: String,
    id: Number,
});
const Paragraph = mongoose.model('paragraphs', paragraphSchema);

const getMaxId = async function () {
    try {
        const maxIdParagraph = await Paragraph.findOne({}, null, {sort: {id: -1}})
        return maxIdParagraph.id

    } catch (error) {
        console.log(error)
    }
};

addParagraph = async function (req, res) {
    let id
    console.log(req.body.title)
    console.log(req.user.username)
    console.log(req.body.content)
    await getMaxId()
        .then((maxId) => {
            id = maxId+1
        })
        .catch((error) =>{
            console.error(error)
            return res.status(500).send({error: error.message})
        })

    let parrafoNuevo = new Paragraph({
        title: req.body.title,
        author: req.user.username,
        content: req.body.content,
        id: id
    })
    await parrafoNuevo.save().then( () => {
        res.sendStatus(200)
    })
        .catch((error) => {
            console.log(error)
        })

}
app.get('/fetch',authenticateToken, async (req, res) => {
    await Paragraph.find()
        .then( docs => {
            let array = []
            for (let doc of docs) {
                array.push(doc.toObject())
            }
            let data = JSON.stringify(array)
            res.json(data);
        })
        .catch((error) => {
            console.log(error)
        })
})

app.get('/', authenticateToken, (req, res) => {
    console.log(req.user)
    res.send('hello world')
})

app.post('/push', midware, authenticateToken, addParagraph)

app.delete('/remove', authenticateToken, async (req, res) => {
    const received_id = parseInt(req.query.id)
    const result = await Paragraph.deleteMany({id:received_id, author:req.user.username})
    res.sendStatus(200)
})








/////////////////////////LOGIN/////////////////////////

const credenciales_validas = async function(username, password){
    const foundUser = await User.findOne({username:username})
    if (foundUser.hash==null) {
        return false
    }
    return bcrypt.compareSync(password, foundUser.hash);
    
}

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token==null){
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,user) =>{
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}


const userSchema = new Schema({
    email: String,
    username: String,
    hash: String,
})
const User = mongoose.model('users', userSchema);

const isUsernameInUse = async function(username){
    if(await User.findOne({username:username})!=null){
        return true
    }
    return false
}
const isEmailInUse = async function(email){
    if(await User.findOne({email:email})!=null){
        return true
    }
    return false
}

const addNewUser = async function (req, res) {
    if(await isUsernameInUse(req.body.username)){
        return res.status(409).send({error: "Username ya en uso"})
    }
    if(await isEmailInUse(req.body.username)){
        return res.status(409).send({error: "Email ya en uso"})
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    let usernNuevo = new User({
        email: req.body.email,
        username: req.body.username,
        hash: hash,
    })
    await usernNuevo.save()
        .then( () => {
            res.sendStatus(200)
         })
        .catch((error) => {
            console.log(error)
        })
}
app.post('/signupform', midware, addNewUser)


app.post('/login', async (req, res) =>{
    if(await credenciales_validas(req.body.username, req.body.password)==false){
        return res.sendStatus(403)
    }
    const accessToken = jwt.sign({username: req.body.username, password: req.body.password}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 20000 })
    res.json({accessToken: accessToken})
})