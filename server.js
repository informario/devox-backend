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
const { hasUncaughtExceptionCaptureCallback } = require('process')

//SPINDOWN FIX//
//const url = 'https://devox-backend.onrender.com';
const url = 'http://localhost:3000'
const axios = require("axios")
const interval = 300000;

function reloadWebsite() {
  axios.get(url)
    .then(response => {
      console.log(`Reloaded at ${new Date().toISOString()}: Status Code ${response.status}`);
    })
    .catch(error => {
      console.error(`Error reloading at ${new Date().toISOString()}:`, error.message);
    });
}

setInterval(reloadWebsite, interval);



/////////////////////////BLOG/////////////////////////
const paragraphSchema = new Schema({
    title: String, // String is shorthand for {type: String}
    author: String,
    content: String,
    id: Number,
    likes: Array
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
app.get('/fetch', authenticateToken, async (req, res) => {
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

app.get('/', (req, res) => {
    res.send('hello world')
})

app.post('/push', midware, authenticateToken, addParagraph)

app.post('/remove', authenticateToken, async (req, res) => {
    const received_id = parseInt(req.body.id)
    const result = await Paragraph.deleteMany({id:received_id, author:req.user.username})
    res.sendStatus(200)
})

app.post('/getlikes',midware,authenticateToken, async (req, res) =>{
    const received_id = req.body.id
    await Paragraph.aggregate([{$match:{id:received_id}}, {$project:{likesize:{$size:"$likes"}}}])
    .then(h => {
        return res.json({value:h[0].likesize})
    })
    .catch(error =>{
        return res.sendStatus(404)
    }
    )
})

app.post('/togglelike', midware, authenticateToken, async(req, res) =>{
    //console.log("username: "+req.body.username+" id: "+req.body.id)
    await Paragraph.findOne({id:req.body.id, likes:{$in: [req.body.username]}})
    .then(async h => {
        if(h==null){
            await Paragraph.updateOne(
                {id: req.body.id},
                { $addToSet:{likes:req.body.username}}
            ).then().catch(error1=>{console.log("error1: "+ error1)})
        }
        else{
            await Paragraph.updateOne(
                {id: req.body.id},
                { $pull:{likes:req.body.username}}
            ).then().catch(error2=>{console.log("error2: "+ error2)})
        }
        //console.log("success")
        return res.sendStatus(200)
    })
    .catch(error =>{
        console.log(error)
        return res.sendStatus(404)
    })
})





/////////////////////////LOGIN/////////////////////////

const credenciales_validas = async function(username, password){
    const foundUser = await User.findOne({username:username})
    if (foundUser==null) {
        return false
    }
    else if(foundUser.hash==null){
        return false
    }
    return bcrypt.compareSync(password, foundUser.hash);
    
}

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token==null){
        console.log(req.headers)
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
    if(await isEmailInUse(req.body.email)){
        return res.status(409).send({error: "Email ya en uso"})
    }
    const hash = bcrypt.hashSync(req.body.password, 10);

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
