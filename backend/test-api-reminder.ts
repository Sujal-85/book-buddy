async function testSingleReminder() {
  const url = 'http://localhost:3001/api/notifications/send-single-reminder';
  const data = {
    studentId: 'test_student_123',
    bookTitle: 'Mastering TypeScript',
    dueDate: '2024-01-01'
  };

  console.log('Sending single reminder request to backend...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testSingleReminder();
