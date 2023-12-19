var express = require('express');
var router = express.Router();
const usermodal=require('./users');
const postmodal=require('./post');
const uploads =require("./Multer");
const passport = require('passport');
const LocalStrategy = require('passport-local');

passport.use(new LocalStrategy(usermodal.authenticate()));

router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.post('/register', function(req, res) {
  const data = new usermodal({
    username: req.body.username,
    name:req.body.name,
    email:req.body.email,
  })

  usermodal.register(data, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res, function(){
      res.redirect("/profile");
    })
  })
});

// router.get("/delete" , function(){
// })
router.get('/like/post/:id',isloggedin, async function(req, res) {
const user= await usermodal.findOne({username: req.session.passport.user});
 const post = await  postmodal.findOne({_id:req.params.id});

if( post.likes.indexOf(user._id) === -1){
  post.likes.push(user._id)
}
else{
post.likes.splice( post.likes.indexOf(user._id),1)
}
await post.save();
res.redirect("/feed");
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false, error:req.flash("error")});
});

router.post('/login', passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/login",
  failureFlash:true,
}), function(req, res) {
});

router.get('/feed',isloggedin,  async function(req, res) {
  const user = await usermodal.findOne({username:req.session.passport.user})
  const posts = await postmodal.find()
  .populate("user")
  res.render('feed', {footer: true,posts,user});
});
    
router.get('/profile', isloggedin, async function(req, res) {
const user = await usermodal.findOne({username: req.session.passport.user})
.populate("posts")
  res.render('profile', {user,footer: true});
});

router.get('/search',isloggedin, function(req, res) {
  res.render('search', {footer: true});
});

router.get("/username/:username",isloggedin, async function(req, res) {
const regex = new RegExp(`^${req.params.username}`,'i');
  const user=  await usermodal.find({username:regex});
  res.json(user);
});

router.get('/edit',isloggedin, async function(req, res) {
  const userdata= await usermodal.findOne({username:req.session.passport.user})
  res.render('edit', {footer: true, userdata});
});

router.get('/upload', function(req, res) {
  res.render('upload', {footer: true});
});

router.post("/upload" ,isloggedin, uploads.single("image"), async function(req,res,next){
const users = await usermodal.findOne({ username:req.session.passport.user});
 const postdata=await postmodal.create({
  picture:req.file.filename,
  posttext:req.body.posttext,
  user:users._id,
})
users.posts.push(postdata._id)
await users.save();
res.redirect("/feed")
})

router.get("/logout", function(req,res,next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
})

function isloggedin(req,res,next){
  if(req.isAuthenticated()){
   return next()
  }
  res.redirect("/login")
}

router.post("/update",uploads.single("image") , async function(req,res){
const userdata= await usermodal.findOneAndUpdate({username:req.session.passport.user},{username:req.body.username, name:req.body.name, bio:req.body.bio,},{new:true});
if(req.file){
  
  userdata.profileImage= req.file.filename;
}
await userdata.save();
res.redirect("/profile");
})

module.exports = router;