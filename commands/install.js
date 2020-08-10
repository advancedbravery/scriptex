exports.permissions = ["manageGuild"]
exports.run = async (msg, args) => {
  if (!args[1]) {
    return msg.channel.sendEmbed({
      title: "No module name provided.",
      description: "Usage example: ``install module_type author/module_name``"
    })
  }
  let type = args[0];
  if(!["command"].includes(type)){
    return msg.channel.sendEmbed({
      title: "Invalid module type provided.",
      description: "Available types:\n``command``"
    })
  }

  let author = args[1].split("/")
  if (author.length < 2) {
    return msg.channel.sendEmbed({
      title: "Invalid module name provided.",
      description: "Usage example: ``install module_type author/module_name``"
    })
  }
  let name = author[1]
  author=author[0]
  let target=await db.collection("modules").findOne({
    author:author,
    name:name,
    type:type
  })
  if(!target){
    return msg.channel.sendEmbed({
      title: "No modules found.",
      description: "There's no modules with that author/name in our registry."
    })
  }
  if(target.private){
    return msg.channel.sendEmbed({
      title: "This module is private.",
      description: "Ask to module owner ("+author+") to install this module.",
      fields:[
        {name:"Note",
        value:"If you're owner of this command, please, connect your github account to profile, and [Re-authorize]("+config.authURI+")"}
      ]
    })
  }
}
