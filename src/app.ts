import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";


const app = express();
const prisma = new PrismaClient();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Server running successfully");
});

app.post("/notes", async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;

    const note = await prisma.note.create({
      data: {
        title,
        description,
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

app.get('/notes', async (req: Request, res: Response) => {
  try {
    const notes = await prisma.note.findMany();
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
app.get('/notes/:id', async (req: Request, res: Response) => {
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
app.delete('/notes/:id', async (req: Request, res: Response) => {
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
export default app;
