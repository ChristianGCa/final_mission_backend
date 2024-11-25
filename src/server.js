import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const SECRET_KEY = process.env.SECRET_KEY || "defaultSecret";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

// GET -> http://localhost:3000/catalog
// Header: Authorization:<token>

app.get("/catalog", authenticateToken, async (req, res) => {
  try {
    let catalog = [];

    if (req.query.type) {
      catalog = await prisma.catalog.findMany({
        where: {
          type: req.query.type,
        },
      });
    } else if (req.query.id) {
      catalog = await prisma.catalog.findMany({
        where: {
          id: req.query.id,
        },
      });
    } else {
      catalog = await prisma.catalog.findMany();
    }

    res.status(200).json(catalog);
  } catch (error) {
    console.error("Erro ao obter o catálogo:", error);
    res.status(500).json({ error: "Um erro ocorreu ao obter o catálogo" });
  }
});

// POST -> http://localhost:3000/login
// Body: email, password

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Senha inválida" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "24h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Erro ao fazer o login:", error);
    res.status(500).json({ error: "Um erro ocorreu ao fazer o login" });
  }
});

// GET -> http://localhost:3000/users
// Header: Authorization:<token>

app.get("/users", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        profiles: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao obter o usuário:", error);
    res.status(500).json({ error: "Um erro ocorreu ao obter o usuário" });
  }
});

// POST -> http://localhost:3000/users
// Body: name, password, email, profiles (optional)

app.post("/users", async (req, res) => {
  try {
    const { name, password, email, profiles } = req.body;

    if (!name || !password || !email) {
      return res
        .status(400)
        .json({ error: "Nome de usuário, senha e email são obrigatórios" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const defaultProfiles = [
      { name: name, img: "https://cdn-icons-png.flaticon.com/512/1253/1253756.png" },
      { name: "Kids", img: "https://cdn-icons-png.flaticon.com/512/2073/2073146.png" },
    ];

    const allProfiles = [
      ...defaultProfiles,
      ...(profiles || []).map(profile => ({
        name: profile.name,
        img: profile.img,
      })),
    ];

    const newUser = await prisma.users.create({
      data: {
        name,
        password: hashedPassword,
        email,
        profiles: {
          create: allProfiles,
        },
      },
      include: {
        profiles: true,
      },
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, SECRET_KEY, {
      expiresIn: "24h",
    });

    res.status(201).json({ user: newUser, token });

    console.log("Novo usuário criado:", newUser);
  } catch (error) {
    if (error.code === 'P2002' && error.meta.target.includes('email')) {
      return res.status(400).json({ error: "Email já existe" });
    }
    console.error("Erro ao criar o usuário:", error);
    res.status(500).json({ error: "Um erro ocorreu ao criar o usuário" });
  }
});

app.delete("/users/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    await prisma.profiles.deleteMany({
      where: {
        userId: userId,
      },
    });

    await prisma.users.delete({
      where: {
        id: userId,
      },
    });

    res.status(200).json({ message: "Usuário com o ID: " + userId + " deletado" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Um erro ocorreu ao deletar o usuário" });
  }
});

// GET -> http://localhost:3000/profiles
// Header: Authorization:<token>

app.get("/profiles", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const profiles = await prisma.profiles.findMany({
      where: {
        userId: userId,
      },
    });

    res.status(200).json(profiles);
  } catch (error) {
    console.error("Erro ao obter os perfis:", error);
    res.status(500).json({ error: "Um erro ocorreu ao obter os perfis" });
  }
});

app.delete("/profiles/:id", authenticateToken, async (req, res) => {
  try {
    const profileId = req.params.id;
    const profile = await prisma.profiles.findUnique({
      where: {
        id: profileId,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "Perfil não encontrado" });
    }

    if (profile.userId !== req.user.id) {
      return res.status(403).json({ error: "Você não tem permissão para deletar esse perfil" });
    }

    await prisma.profiles.delete({
      where: {
        id: profileId,
      },
    });

    res.status(200).json({ message: "Perfil com o ID: " + profileId + " deletado" });
  } catch (error) {
    console.error("Erro ao deletar o perfil:", error);
    res.status(500).json({ error: "Um erro ocorreu ao deletar o perfil" });
  }
});


app.listen(3000);