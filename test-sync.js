// Manual sync test for debugging
const fetch = require('node-fetch');

async function testSync() {
  try {
    // Get the latest event (should be the "new test event july 30")
    const eventsResponse = await fetch('http://localhost:5000/api/calendar/events', {
      headers: {
        'Cookie': 'connect.sid=s%3A_kI8cIKXzjYQJ3p3qxEH8i2xhfwBmCT0.PcTRWdyV3pOGQ8vTmwIoEoTfCv%2FkuTRJnojAOUMXKj8'
      }
    });
    
    if (!eventsResponse.ok) {
      console.log('Failed to fetch events:', eventsResponse.status);
      return;
    }
    
    const events = await eventsResponse.json();
    console.log('Total events:', events.length);
    
    // Find the July 30 event
    const july30Event = events.find(e => 
      e.startDate === '2025-07-30' && 
      e.title.toLowerCase().includes('test')
    );
    
    if (july30Event) {
      console.log('Found July 30 event:', {
        id: july30Event.id,
        title: july30Event.title,
        startDate: july30Event.startDate,
        startTime: july30Event.startTime,
        googleEventId: july30Event.googleEventId,
        syncedToGoogle: july30Event.syncedToGoogle
      });
    } else {
      console.log('July 30 test event not found');
      console.log('Available events:');
      events.slice(0, 5).forEach(e => {
        console.log('-', e.title, e.startDate, e.eventType);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSync();