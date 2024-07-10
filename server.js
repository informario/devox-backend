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

//DATABASE//
const mongoose = require('mongoose')
const {Schema} = mongoose;
mongoose.connect(process.env.MONGO_URI)
const paragraphSchema = new Schema({
    title: String, // String is shorthand for {type: String}
    author: String,
    content: String,
    id: Number,
});
const Paragraph = mongoose.model('paragraphs', paragraphSchema);

const getMaxId = async () => {
    try {
        const maxIdParagraph = await Paragraph.findOne({}, null, {sort: {id: -1}})
        return maxIdParagraph.id

    } catch (error) {
        console.log(error)
    }
};


//FUNCIONES//


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
        author: req.body.author,
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


//ENDPOINTS//


app.get('/fetch', async (req, res) => {
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

app.post('/push', midware, addParagraph)

app.delete('/remove', async (req, res) => {
    const received_id = parseInt(req.query.id)
    const result = await Paragraph.deleteMany({id:received_id})
    res.sendStatus(200)
})

