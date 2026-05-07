const Datastore = require('@seald-io/nedb');
const users = new Datastore({ filename: 'db/users.db', autoload: true })
const products = new Datastore({ filename: 'db/products.db', autoload: true });

module.exports.users = users
module.exports.products = products