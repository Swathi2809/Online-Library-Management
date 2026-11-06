const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'books.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper functions to read/write JSON data
function readBooks() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    return [];
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data || '[]');
}

function writeBooks(books) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2));
}

// 1. Get all books
app.get('/api/books', (req, res) => {
  const books = readBooks();
  res.json(books);
});

// 2. Add a new book
app.post('/api/books', (req, res) => {
  const { title, author, isbn } = req.body;
  if (!title || !author || !isbn) {
    return res.status(400).json({ message: 'All fields (title, author, isbn) are required' });
  }

  const books = readBooks();
  const newBook = {
    id: Date.now().toString(),
    title,
    author,
    isbn,
    status: 'Available',
    issuedTo: null,
    issueDate: null,
    dueDate: null
  };

  books.push(newBook);
  writeBooks(books);
  res.status(201).json(newBook);
});

// 3. Delete a book
app.delete('/api/books/:id', (req, res) => {
  let books = readBooks();
  books = books.filter(b => b.id !== req.params.id);
  writeBooks(books);
  res.json({ message: 'Book deleted successfully' });
});

// 4. Issue a book
app.post('/api/books/:id/issue', (req, res) => {
  const { studentName, days } = req.body;
  const books = readBooks();
  const book = books.find(b => b.id === req.params.id);

  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (book.status === 'Issued') return res.status(400).json({ message: 'Book is already issued' });

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(issueDate.getDate() + (parseInt(days) || 7));

  book.status = 'Issued';
  book.issuedTo = studentName || 'Student';
  book.issueDate = issueDate.toISOString().split('T')[0];
  book.dueDate = dueDate.toISOString().split('T')[0];

  writeBooks(books);
  res.json(book);
});

// 5. Return a book (Calculates Fine)
app.post('/api/books/:id/return', (req, res) => {
  const books = readBooks();
  const book = books.find(b => b.id === req.params.id);

  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (book.status === 'Available') return res.status(400).json({ message: 'Book was not issued' });

  const today = new Date();
  const due = new Date(book.dueDate);
  let fine = 0;

  if (today > due) {
    const diffTime = Math.abs(today - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    fine = diffDays * 10; // ₹10 per day fine
  }

  book.status = 'Available';
  book.issuedTo = null;
  book.issueDate = null;
  book.dueDate = null;

  writeBooks(books);
  res.json({ message: 'Book returned successfully', fine });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});