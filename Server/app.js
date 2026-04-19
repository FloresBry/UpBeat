import express from "express";

import {
    getUserById,
    addUser,
    deleteUser,
    getUserByEmail,
    updateUser,
    ensureExercisesSeeded,
    ensureRoutineDifficultyColumn,
    syncAllRoutineDifficulties,
    getExercises,
    createRoutineWithExercises,
    getRoutinesByUserId,
    getRoutineById,
    deleteRoutineById,
    removeExerciseFromRoutine,
    addExerciseToRoutine,
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

await ensureExercisesSeeded();
await ensureRoutineDifficultyColumn();
await syncAllRoutineDifficulties();


app.get("/perfil/:id", async (req,res)=>{
    const user = await getUserById(req.params.id);
    res.status(200).send(user);
});

app.delete("/usuario/:id",async (req,res)=> {
    await deleteUser(req.params.id);
    res.send({message: "User deleted succesfully"});
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

app.post('/user/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required.' });
    }

    const user = await getUserByEmail(email);

    if (!user || user.password !== password) {
        return res.status(401).send({ message: 'Invalid credentials.' });
    }

    res.status(200).send({
        message: 'Login successful',
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
});

app.listen(process.env.WEB_PORT, ()=> {
    console.log(`Server running on port ${process.env.WEB_PORT}`)
});

app.put("/user/update/:id", async (req, res) => {
    const { name, password } = req.body;
    const userId = req.params.id;
    try {
        await updateUser(userId, name, password);
        res.status(200).send({ message: "¡Perfil actualizado con éxito!" });
    } catch (error) {
        res.status(500).send({ message: "Error al actualizar" });
    }
});
