module.exports=async(req,res,next)=>{
  if(!req.query.code){
    return res.json({ok:false,message:"Invalid code"})
  }

  let discord_resp=await fetch("https://discord.com/api/oauth2/token",{
    method:"POST",
    headers:{
      "Content-type":"application/x-www-form-urlencoded"
    },
    body:fue.default({
      'client_id':client.user.id,
      'client_secret': config.secret,
      'grant_type': 'authorization_code',
      'code': req.query.code,
      'redirect_uri': config.host + "/login",
      'scope': 'identify connections'
    })
  })
  discord_resp=await discord_resp.json()

  if(typeof discord_resp.access_token=="undefined"){
    return res.json({ok:false,error:"invalid token"})
  }
  let user=await fetch("https://discord.com/api/v6/users/@me",{headers:{"Authorization":"Bearer "+discord_resp.access_token}})
  user=await user.json()
  let connections= await fetch("https://discord.com/api/v6/users/@me/connections",{headers:{"Authorization":"Bearer "+discord_resp.access_token}})
  connections=await connections.json()
  let githubs=connections.filter(connection=>{return connection.type=="github"&&connection.verified==true}).map(c=>c.name)
  db.collection("githubs").updateOne({user:user.id},{$set:{githubs:githubs}},{upsert:true})
  res.render("index",{libs:["login"],data:{token:discord_resp.access_token}})
}
