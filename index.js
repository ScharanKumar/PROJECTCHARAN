const express = require("express");
const path = require("path");
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const port = process.env.PORT || 3030


const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json())
app.use(cors({
    origin:"http://localhost:3004"
}))
const dbPath = path.join(__dirname, "database.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register/",async(request,response)=>{
    const { username,password} = request.body;
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM register WHERE username like '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          register (username,password) 
        VALUES 
          (
            '${username}', 
            '${hashedPassword}'
          )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
})

app.post("/login/", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM register WHERE username = '${username}'`;
    const dbUser1 = await db.get(selectUserQuery);
    if (dbUser1 === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser1.password);
      if (isPasswordMatched === true) {
        const payload = {
          username: username,
        };
        const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
        response.send({ jwtToken });
      } else {
        response.status(400);
        response.send("Invalid Password");
      }
    }
  });

  app.post("/todo/post/",async(request,response)=>{
    const {id,heading,description}=request.body
    const query=`insert into todolist(id,heading,description)
    values ('${id}','${heading}','${description}');`
    const res1 = await db.run(query)
    const newUserId = res1.lastID;
    response.send(`Created new todo with ${newUserId}`);

  })

  app.get("/todo/get/",async(request,response)=>{
    const query=`select * from todolist;`
    const res2 = await db.all(query)
    response.send(res2);
  })

  app.delete("/delete/todo/:id",async(request,response)=>{
    const {id}=request.params
    const query=`delete from todolist
    where id like '${id}';`
    const res3 = await db.run(query)
    response.send("Todo successfully deleted");
  })

  app.post("/contact/post/",async(request,response)=>{
    const {name,id,number}=request.body
    const query=`insert into contacts(name,id,number)
    values ('${name}','${id}','${number}');`
    const res4 = await db.run(query)
    const newUserId = res4.lastID;
    response.send(`Created new contact with ${newUserId}`);

  })

  app.get("/contact/get/",async(request,response)=>{
    const query=`select * from contacts;`
    const res5 = await db.all(query)
    response.send(res5);
  })

  app.delete("/delete/contact/:id",async(request,response)=>{
    const {id}=request.params
    const query=`delete from contacts
    where id like '${id}';`
    const res6 = await db.run(query)
    response.send("Contact successfully deleted");
  })