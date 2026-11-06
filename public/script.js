document.addEventListener('DOMContentLoaded', fetchBooks);
document.getElementById('addBookForm').addEventListener('submit', addBook);

let allBooks = [];

async function fetchBooks() {
  const res = await fetch('/api/books');
  allBooks = await res.json();
  renderBooks(allBooks);
}

function renderBooks(books) {
  const tbody = document.getElementById('bookTableBody');
  tbody.innerHTML = '';

  if (books.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No books found.</td></tr>';
    return;
  }

  books.forEach(book => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${book.title}</strong></td>
      <td>${book.author}</td>
      <td>${book.isbn}</td>
      <td><span class="badge ${book.status.toLowerCase()}">${book.status}</span></td>
      <td>${book.issuedTo || '-'}</td>
      <td>${book.dueDate || '-'}</td>
      <td>
        ${book.status === 'Available' 
          ? `<button class="action" onclick="issueBook('${book.id}')">Issue</button>` 
          : `<button class="action" onclick="returnBook('${book.id}')">Return</button>`}
        <button class="danger" onclick="deleteBook('${book.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function addBook(e) {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const author = document.getElementById('author').value;
  const isbn = document.getElementById('isbn').value;

  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author, isbn })
  });

  if (res.ok) {
    document.getElementById('addBookForm').reset();
    fetchBooks();
  }
}

async function deleteBook(id) {
  if (confirm('Are you sure you want to delete this book?')) {
    await fetch(`/api/books/${id}`, { method: 'DELETE' });
    fetchBooks();
  }
}

async function issueBook(id) {
  const studentName = prompt('Enter Student Name:');
  if (!studentName) return;

  const days = prompt('Enter number of days (default 7):', '7');

  const res = await fetch(`/api/books/${id}/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentName, days })
  });

  if (res.ok) fetchBooks();
}

async function returnBook(id) {
  const res = await fetch(`/api/books/${id}/return`, { method: 'POST' });
  const data = await res.json();

  if (data.fine > 0) {
    alert(`Book returned! Overdue fine to pay: ₹${data.fine}`);
  } else {
    alert('Book returned successfully! No fine.');
  }
  fetchBooks();
}

function searchBooks() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allBooks.filter(b => 
    b.title.toLowerCase().includes(query) || 
    b.author.toLowerCase().includes(query)
  );
  renderBooks(filtered);
}