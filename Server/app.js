import express from "express";

import {
    getUserById,
    addUser,
    deleteUser,
    getUserByEmail,
    updateUser,
} from "./database.js";

import cors from 'cors';
const corsOption= {
    origin: "*",
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
};

const app = express ();
app.use(express.json());
app.use(cors(corsOption));


app.get("/perfil/:id", async (req,res)=>{
    const user = await getUserById(req.params.id);
    res.status(200).send(user);
});

app.delete("/ususario/:id",async (req,res)=> {
    await deleteUser(req.params.id);
    res.send({message: "User deleted succesfully"});
});

app.post("/usuario/registro", async (req, res)=> {
    const  {name, email, password} = req.body;
    const user = await addUser(name,email,password);
    res.status(201).send(user);
});

app.listen(process.env.WEB_PORT, ()=> {
    console.log(`Server running on port ${process.env.WEB_PORT}`)
});

app.put("/user/update/:id", async (req, res) => {
    const { name, password } = req.body;
    const userId = req.params.id;
    try {
        // Aquí le pedimos a la base de datos que cambie los datos
        // (Asegúrate de que tu compañero añada 'updateUser' en database.js)
        await pool.query(
            `UPDATE users SET name = ?, password = ? WHERE id = ?`,
            [name, password, userId]
        );
        res.status(200).send({ message: "¡Perfil actualizado con éxito!" });
    } catch (error) {
        res.status(500).send({ message: "Error al actualizar" });
    }
});
