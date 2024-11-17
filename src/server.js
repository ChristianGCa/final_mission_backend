import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import dotenv from "dotenv";

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
    console.error("Error getting catalog:", error);
    res.status(500).json({ error: "An error occurred while getting the catalog" });
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
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "An error occurred while logging in" });
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
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "An error occurred while getting the user" });
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
        .json({ error: "Name, password, and email are required" });
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

    res.status(201).json(newUser);

    console.log("New user created:", newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "An error occurred while creating the user" });
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

    res.status(200).json({ message: "User with ID: " + userId + " deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "An error occurred while deleting the user" });
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
    console.error("Error getting profiles:", error);
    res.status(500).json({ error: "An error occurred while getting the profiles" });
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
      return res.status(404).json({ error: "Profile not found" });
    }

    if (profile.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own profiles" });
    }

    await prisma.profiles.delete({
      where: {
        id: profileId,
      },
    });

    res.status(200).json({ message: "Profile with ID: " + profileId + " deleted" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "An error occurred while deleting the profile" });
  }
});


app.listen(3000);