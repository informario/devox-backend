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
    console.log(`Example app listening on port ${port}`)
})
//BODYPARSER
let bodyParser = require('body-parser')
midware = bodyParser.urlencoded({extended: false})
app.use(bodyParser.json());


//ESTRUCTURAS DE DATOS//

class Paragraph {
    constructor(title, author, content, id){
        this.title = title
        this.author = author
        this.content = content
        this.id = id
    }
}
let paragraphs = []

//FUNCIONES//

addParagraph = function(req,res){
    let parrafoNuevo = new Paragraph(req.body.title, req.body.author, req.body.content, req.body.id)
    paragraphs.push(parrafoNuevo)
    res.sendStatus(200)
    console.log(paragraphs)
}

//ENDPOINTS//
app.get('/fetch', (req, res) => {
    let data = JSON.stringify(paragraphs)
    res.json(data)
})

app.get('/', (req, res) => {
    res.send('hello world')
})
app.post('/push', midware, addParagraph)

app.delete('/remove', (req, res) => {
    const id = req.query.id
    paragraphs = paragraphs.filter(
        (t) => t.id != id
    )
    console.log(paragraphs)
    res.sendStatus(200)

})