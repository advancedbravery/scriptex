(async () => {

  process.chdir(__dirname)
  global.fs = require("fs")
  let config = require("./config.js"),
    Eris = require("eris"),
    fetch = require("node-fetch"),
    mongodb = require("mongodb"),
    fue = require("form-urlencoded"),
    mongoClient = new mongodb.MongoClient(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }),
    express = require("express"),
    client = new Eris(config.token, {
      maxShards: "auto",
      compress: true,
      allowedMentions: {
        everyone: false
      },
      defaultImageFormat: "webp"
    })
  global.fue = fue
  global.fetch = fetch
  global.config=config
  global.client = client
  await client.connect()
  let app = express()
  app.listen(8080)

  let mongoHost = await mongoClient.connect()
  global.db = mongoHost.db(config.database)
  Object.defineProperty(Eris.Message.prototype, 'guild', {
    get: function() {
      return this._client.guilds.get(this.guildID)
    }
  });
  Object.defineProperty(Eris.Guild.prototype, 'gdb', {
    get: function() {
      let guild = this
      return {
        getItem: async (key) => {
          let gdb_doc = await db.collection("gdb").findOne({
            id: guild.id
          })
          if (!gdb_doc) {
            await db.collection("gdb").insertOne({
              id: guild.id,
              data: {
                prefix: "%"
              }
            })
            gdb_doc = await db.collection("gdb").findOne({
              id: guild.id
            })
          }
          return gdb_doc.data[key]
        },
        setItem: async (key, value) => {
          let gdb_doc = await db.collection("gdb").findOne({
            id: guild.id
          })
          if (!gdb_doc) {
            await db.collection("gdb").insertOne({
              id: guild.id,
              data: {
                prefix: "%"
              }
            })
            gdb_doc = await db.collection("gdb").findOne({
              id: guild.id
            })
          }
          gdb_doc.data[key] = value
          await db.collection("gdb").replaceOne({
            id: guild.id
          }, gdb_doc)
          return gdb_doc
        }
      }
    }
  });
  Eris.TextChannel.prototype.sendEmbed = function(embed) {
    this.createMessage({
      embed: {
        ...embed,
        type: "rich"
      }
    })
  }


  client.on("messageCreate", async (msg) => {
    if (msg.author.bot || !msg.guildID) {
      return
    }
    let customPrefix = await msg.guild.gdb.getItem("prefix")
    let mention = "<@!" + client.user.id + "> "

    if (msg.content.startsWith(mention) || msg.content.startsWith(customPrefix)) {
      let prefix = msg.content.startsWith(mention) ? mention : customPrefix
      let args = msg.content.split(" ")

      let command = args[0].slice(prefix.length)
      if (command.trim().length < 1) {
        command += args[1];
        args.splice(0, 1)
      }
      args.splice(0, 1)
      if (!command) {
        return
      }
      if (fs.existsSync("./commands/" + command + ".js")) {
        let cmd = require("./commands/" + command + ".js")
        let userMissingPerms = cmd.permissions.filter(permission => {
          return !msg.member.permission.has(permission)
        })
        let botMissingPerms = cmd.permissions.filter(permission => {
          return !msg.guild.members.get(client.user.id).permission.has(permission)
        })
        if (userMissingPerms.length > 0) {
          return msg.channel.sendEmbed({
            title: "Missing permissions",
            description: "You're missing these permissions: " + userMissingPerms.map(p => ` \`\`${p}\`\``).join("")
          })
        }
        if (botMissingPerms.length > 0) {
          return msg.channel.sendEmbed({
            title: "Missing permissions",
            description: "I'm missing these permissions: " + botMissingPerms.map(p => ` \`\`${p}\`\``).join("") + "\nTo execute ``" + command + "`` command."
          })
        }
        cmd.run(msg, args)
      }
    }
  });
  let linkMap = require("./links.json")
  app.set("view engine","ejs")
  app.use(express.json())
  app.use(express.static(__dirname+"/static"))
  Object.keys(linkMap).forEach(method => {
    let methodLowered = method.toLowerCase()
    if (app[methodLowered]) {
      Object.keys(linkMap[method]).forEach(link => {
        app[methodLowered](link, require("./api/" + linkMap[method][link]))
      })
    }
  })
})()
