import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

// HTTP Methods
// for catalog table

app.get("/catalog", async (req, res) => {
  try {
    let catalog = [];

    if (req.query) {
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

app.get("/users", async (req, res) => {
  try {
    let users = [];

    if (req.query) {
      users = await prisma.users.findMany({
        where: {
          id: req.query.id,
        },
      });
    } else {
      users = await prisma.users.findMany();
    }
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "An error occurred while getting the users" });
  }
});

app.post("/users", async (req, res) => {
  try {
    console.log("Request received at /users");
    console.log("Request body:", req.body);

    let { name, password, email, profiles } = req.body;

    if (!name || !password || !email) {
      return res
        .status(400)
        .json({ error: "Name, password and email are required" });
    }

    name = String(name);
    password = String(password);
    email = String(email);

    const newUser = await prisma.users.create({
      data: {
        name: name,
        password: password,
        email: email,
        profiles: {
          create: profiles?.map(profile => ({
            name: profile.name,
          })) || [],
        },
      },
      include: {
        profiles: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "An error occurred while creating the user" });
  }
});


app.put("/users/:id", async (req, res) => {
  try {
    await prisma.users.update({
      where: {
        id: req.params.id,
      },
      data: {
        name: req.body.name,
        password: req.body.password,
        email: req.body.email,
        profiles: {
          create: req.body.profiles?.map(profile => ({
            name: profile.name,
          })) || [],
        },
      },
    });
    res.status(200).json(req.body);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "An error occurred while updating the user" });
  }
});

app.delete("/users/:id", async (req, res) => {
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

app.get("/profiles", async (req, res) => {
  try {
    let profiles = [];
    if (req.query.userId) {
      profiles = await prisma.profiles.findMany({
        where: {
          user: {
            id: req.query.userId,
          },
        },
      });
    } else {
      profiles = await prisma.profiles.findMany();
    }

    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error getting profiles:", error);
    res.status(500).json({ error: "An error occurred while getting the profiles" });
  }
});

app.post("/profiles", async (req, res) => {
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

app.delete("/profiles/:id", async (req, res) => {
  try {
    const profileId = req.params.id;
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