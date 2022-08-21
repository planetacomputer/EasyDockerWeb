const mongoose = require('mongoose')

const QuizSchema = new mongoose.Schema({
  sessionID: {
    type: String,
    required: true,
  },
  slugLaboratori: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email:{
    type:String,
    required: true,
  },
  nota:{
    type: Number
  },
  arrEncerts: [[Number]],
  datePosted:{ 
    /* can declare property type with an object like this because we need 'default' */ 
    type: Date, 
    default: new Date() 
}
},
{ timestamps: true })

module.exports = mongoose.model('Quiz', QuizSchema)