import app from "./app";

const PORT = 5000;
//PORT, callback function, callback function will run when the server starts successfully
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});