const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './.env' })

const app = require('./app')

mongoose
    .connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection successful'))

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log(`App running at PORT: ${port}...`)
})
