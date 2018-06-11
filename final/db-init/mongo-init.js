
db.createUser({
  user: "root",
  pwd: "hunter2",
  roles: [ { role: "readWrite", db: "users" } ]
})

db.users.createIndex( { "userID": 1 }, { unique: true } )
