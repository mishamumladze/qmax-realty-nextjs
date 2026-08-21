const D = require("better-sqlite3");
const db = new D("data/qmax.sqlite", { readonly: true });
console.log(
  "residue check:",
  JSON.stringify(db.prepare("SELECT COUNT(*) c FROM properties WHERE slug LIKE ?").get("%__task3%"))
);
console.log("total properties now:", db.prepare("SELECT COUNT(*) c FROM properties").get().c);
db.close();
