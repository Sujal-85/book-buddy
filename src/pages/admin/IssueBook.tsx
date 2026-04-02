import React, { useState } from 'react';
import { Search, Calendar, CheckCircle } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibInput from '@/components/ui/LibInput';
import PageHeader from '@/components/layout/PageHeader';
import toast from 'react-hot-toast';

const demoStudents = [
  { id: 'STU-001', name: 'Alice Johnson' },
  { id: 'STU-002', name: 'Bob Smith' },
  { id: 'STU-003', name: 'Carol White' },
];

const demoBooks = [
  { id: '1', title: 'Clean Code', isbn: '9780132350884', available: true },
  { id: '2', title: 'The Pragmatic Programmer', isbn: '9780135957059', available: true },
  { id: '3', title: 'Introduction to Algorithms', isbn: '9780262033848', available: true },
];

const IssueBook: React.FC = () => {
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<typeof demoStudents[0] | null>(null);
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<typeof demoBooks[0] | null>(null);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [submitted, setSubmitted] = useState(false);

  const filteredStudents = studentSearch ? demoStudents.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.id.toLowerCase().includes(studentSearch.toLowerCase())
  ) : [];

  const filteredBooks = bookSearch ? demoBooks.filter((b) =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.isbn.includes(bookSearch)
  ) : [];

  const handleSubmit = () => {
    if (!selectedStudent || !selectedBook) return;
    toast.success(`"${selectedBook.title}" issued to ${selectedStudent.name}`);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <PageHeader title="Issue Book" />
        <LibCard className="max-w-md mx-auto text-center py-12">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Book Issued Successfully</h3>
          <p className="text-sm text-muted-foreground mb-6">
            "{selectedBook?.title}" has been issued to {selectedStudent?.name}
          </p>
          <LibButton onClick={() => { setSubmitted(false); setSelectedStudent(null); setSelectedBook(null); }}>
            Issue Another Book
          </LibButton>
        </LibCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Issue Book" description="Issue a book to a student" />

      <div className="max-w-lg mx-auto space-y-6">
        {/* Step 1: Select Student */}
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Step 1: Select Student</h3>
          {selectedStudent ? (
            <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedStudent.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.id}</p>
              </div>
              <LibButton variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>Change</LibButton>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name or ID..." className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {filteredStudents.length > 0 && (
                <div className="absolute w-full mt-1 bg-card border border-border rounded-md z-10">
                  {filteredStudents.map((s) => (
                    <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(''); }} className="w-full text-left px-3 py-2 hover:bg-secondary text-sm">
                      {s.name} <span className="text-muted-foreground">({s.id})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </LibCard>

        {/* Step 2: Select Book */}
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Step 2: Select Book</h3>
          {selectedBook ? (
            <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedBook.title}</p>
                <p className="text-xs text-muted-foreground">ISBN: {selectedBook.isbn}</p>
              </div>
              <LibButton variant="ghost" size="sm" onClick={() => setSelectedBook(null)}>Change</LibButton>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Search by title or ISBN..." className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {filteredBooks.length > 0 && (
                <div className="absolute w-full mt-1 bg-card border border-border rounded-md z-10">
                  {filteredBooks.map((b) => (
                    <button key={b.id} onClick={() => { setSelectedBook(b); setBookSearch(''); }} className="w-full text-left px-3 py-2 hover:bg-secondary text-sm">
                      {b.title} <span className="text-muted-foreground">(ISBN: {b.isbn})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </LibCard>

        {/* Step 3: Due Date */}
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Step 3: Set Due Date</h3>
          <LibInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </LibCard>

        {/* Step 4: Confirm */}
        <LibButton
          className="w-full"
          disabled={!selectedStudent || !selectedBook}
          onClick={handleSubmit}
        >
          <Calendar className="h-4 w-4 mr-2" /> Confirm & Issue Book
        </LibButton>
      </div>
    </div>
  );
};

export default IssueBook;
