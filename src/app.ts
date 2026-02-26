import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextFunction } from "express";

const app = express();
app.use(express.json());
const prisma = new PrismaClient();

const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "supersecret") as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

app.get("/", (req: Request, res: Response) => {
  res.send("Server running successfully");
});

app.post("/notes", authMiddleware, async (req: any, res: Response) => {
  try {
    const { title, description } = req.body;

    const note = await prisma.note.create({
      data: {
        title,
        description,
        user: {
          connect: { id: req.userId }
        }
      },
    });

    res.status(201).json({
      message: "Note created successfully",
      data: note,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.get('/notes', authMiddleware, async (req: any, res: Response) => {
  try {
    const notes = await prisma.note.findMany({
      where: {
        userId: req.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      message: "Notes retrieved successfully",
      data: notes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});
app.get('/notes/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const id = Number(req.params.id);

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.status(200).json({
      message: "Note retrieved successfully",
      data: note
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
});
app.delete('/notes/:id', authMiddleware, async (req: any, res: Response) => {
  try {
    const id = Number(req.params.id);

    const note = await prisma.note.findUnique({
      where: { id }
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    await prisma.note.delete({
      where: { id }
    });

    res.status(200).json({
      message: "Note deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
});

app.patch('/notes/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const { title, description } = req.body;
  await prisma.note.update({
    where: {
      id: Number(id)
    },
    data: {
      title,
      description
    }
  })
  res.status(200).json({
    message: "Note updated successfully"
  });
});

app.post("/register", async (req: Request, res: Response) => {
  try {
    const {email, password, name} = req.body;
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name
      }
    });
    res.status(201).json({
      message: "User created successfully",
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
  });

app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id },
      "supersecret",   // move to .env later
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
export default app;
