const express = require('express')
require('dotenv').config()
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const {user,Account} = require('./Schemas')
const jwt = require('jsonwebtoken')
app.use(cors({
    origin:'*',
}))
app.use(express.json())
const authMiddleware = (req,res,next)=>{
   const authToken = req.headers['x-access-token']
   if(authToken){
    const decoded = jwt.verify(authToken,process.env.SECRET);
    req.user = decoded;
    next();
   }
   else{
    return res.status(403).json({});
   }
}
app.get('/',(req,res)=>{
    res.send("Welcome to Instapay")
})
app.post('/register',async (req,res)=>{
     const {userName,password,firstName,lastName} = req.body
     console.log(req.body)
     const currentUser = await user.findOne({
        userName:userName
     })
     const anCurrentUser = await user.findOne({
        lastName:lastName
     })
     const anCurrentUser1 = await user.findOne({
        firstName:firstName
     })
     if(currentUser || anCurrentUser || anCurrentUser1){
        
        return res.json({
            message:'User already exists'
        })
        
     }
     const presentUser = await user.create({
        userName:userName,
        password:password,
        firstName:firstName,
        lastName:lastName
     })
     res.json({
         message:'registered successfully'
     })
     const userId = presentUser._id;

  await Account.create({
     userId,
     balance: 1 + Math.random() * 10000
 })

})
app.post('/login',async (req,res)=>{
    const {userName,password} = req.body
    const currentUser = await user.findOne({userName})
    if(currentUser){
        if(currentUser.password===password){
            const token = jwt.sign({
                user_ID:currentUser._id
            },process.env.SECRET)
            return res.json({
                message:'Logged In successfully',
                token:token
            })
            
        }
        else {
            return res.json({
            message:'Incorrect Password'
        })
        }
        res.status(411).json({
            message: "Error while logging in"
        })
    }
})
app.get('/user',authMiddleware,async (req,res)=>{
    const currentUser = await user.findOne({
        _id:req.user.user_ID
    })
    res.json({
        message:'User Found',
        user:currentUser
    })
})
app.post('/account/bulk',authMiddleware,async (req,res)=>{
    const filter = req.body.filter || "";
    console.log(filter)
    const users = await user.find({
        $or:[{
            firstName:{
                "$regex":filter,
                "$options": "i"
            }
        },{
            lastName:{
                "$regex":filter,
                "$options": "i"
            }
        }]
    })
    res.json({
        user: users.map(user => ({
            username: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    }) 
})
app.get("/account/balance", authMiddleware, async (req, res) => {
    
    const currentUser = await Account.findOne({
        userId:req.user.user_ID
    })
    console.log(currentUser)
    res.json({
        balance: currentUser.balance,
        recentTransaction:currentUser.recentTransaction
    })
});
app.get('/user/:otherUserId',authMiddleware,async(req,res)=>{
    const Id = req.params.otherUserId
    const otherUser = await user.findOne({
        _id:Id
    })
    res.status(200).json({
        message:'Fetched Successfully',
        data:{
            _id:Id,
            username:otherUser.userName
        }
    })
})
app.post('/account/transfer',authMiddleware,async(req,res)=>{
    const {amount,to} = req.body
    const account = await Account.findOne({
        userId:req.user.user_ID
    })
    const accountUser = await user.findOne({
        _id:account.userId
    })
    console.log(account)
    if(account.balance<amount){
        return res.json({
            message:'Insufficient Balance'
        })
    }
    const toAccount = await Account.findOne({
        userId:to
    })
    const toAccountUser = await user.findOne({
        _id:toAccount.userId
    })
    console.log(toAccount)
    if(!toAccount){
        return res.json({
            message:'No user Exists'
        })
    }



   await Account.updateOne({
    userId:req.user.user_ID},
    {
        $inc:{
        balance:-amount
    }
   })


   toAccount.recentTransaction.push({
    otherUser:accountUser.userName,
    amount:amount,
    type:'credit'
   })

   toAccount.save()
    
   account.recentTransaction.push({
    otherUser:toAccountUser.userName,
    amount:amount,
    type:'debit'
   })
   account.save()
   

   await Account.updateOne({
    userId:to,
   },{
    $inc:{
        balance:amount
    }
   })

   res.json({
    message: "Transfer successful"
              })

   
})


app.listen(3000,()=>{
    console.log('Server running')
})



