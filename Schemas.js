const mongoose = require('mongoose')

// mongodb+srv://tarakravindra242005:G6DPxr02t7K3myUB@usersdb.ospvpeo.mongodb.net/?retryWrites=true&w=majority 
mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log('Connected to database')
}).catch(err=>console.log(err))

const userData = new mongoose.Schema({
   userName:{ type: String,  },
   password:{ type: String,  },
   firstName:{ type: String,},
   lastName:{ type: String, }  
})
const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    recentTransaction:{
        type:Array
    }
});

const Account = mongoose.model('Account', accountSchema);
const user = mongoose.model('User',userData)

module.exports={
   user,
   Account
}
