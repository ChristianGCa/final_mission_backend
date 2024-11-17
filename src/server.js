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

// HTTP Methods
// for catalog table

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


// HTTP Methods
// for users tabel

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


app.get("/users", authenticateToken, async (req, res) => {
  try {
    if (req.query.id && req.query.id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    let users = [];
    if (req.query.id) {
      users = await prisma.users.findMany({
        where: {
          id: req.query.id,
        },
      });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "An error occurred while getting the users" });
  }
});


app.post("/users", async (req, res) => {
  try {
    let { name, password, email, profiles } = req.body;

    if (!name || !password || !email) {
      return res
        .status(400)
        .json({ error: "Name, password and email are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({
      data: {
        name,
        password: hashedPassword,
        email,
        profiles: {
          create: profiles?.map((profile) => ({
            name: profile.name,
          })) || [],
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



app.put("/users/:id", authenticateToken, async (req, res) => {
  try {
    const hashedPassword = req.body.password
      ? await bcrypt.hash(req.body.password, 10)
      : undefined;

    const data = {
      name: req.body.name,
      email: req.body.email,
      ...(hashedPassword && { password: hashedPassword }),
    };

    await prisma.users.update({
      where: {
        id: req.params.id,
      },
      data,
    });

    res.status(200).json(req.body);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "An error occurred while updating the user" });
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

// HTTP Methods
// for profiles table
// The method can receive an user ID as a query parameter for filtering profiles by user
// Example normal: GET -> http://localhost:3000/profiles
// With userID: GET -> http://localhost:3000/profiles?userId=123

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



app.post("/profiles", authenticateToken, async (req, res) => {
  try {
    const { name, userId } = req.body;
    const newProfile = await prisma.profiles.create({
      data: {
        name: name,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
    res.status(201).json(newProfile);
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ error: "An error occurred while creating the profile" });
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