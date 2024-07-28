import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { App as RealmApp, Credentials } from "realm-web";
import { route } from 'preact-router';

// MongoDB auth
const app = new RealmApp({ id: "application-0-rbrbg" });

// Month names array
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EventPage = () => {
  // State management
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showAttendeesSelection, setShowAttendeesSelection] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  const username = localStorage.getItem("loggedInUsername");

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    async function init() {
      const user = await app.logIn(Credentials.anonymous());
      setLoggedInUser(user);

      // Fetch events and generate calendar days
      displayEvents(user);
      generateCalendarDays(currentYear, currentMonth);

      // Fetch all users excluding the current one
      const mongodb = user.mongoClient("mongodb-atlas");
      const usersCollection = mongodb.db("PROJECT0").collection("user");
      const fetchedUsers = await usersCollection.find({});
      const filteredUsers = fetchedUsers.filter(u => u._id !== user.id);
      setAllUsers(filteredUsers);
    }
    init();
  }, [events, currentMonth, currentYear]);

  const generateCalendarDays = (year, month) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const calendarDays = Array.from({ length: firstDay }, () => null);

    const username = localStorage.getItem('loggedInUsername');
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

    for (let day = 1; day <= numDays; day++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => formatDate(event.date) === fullDate);
      const isEvent = dayEvents.length > 0;
      const isUserInvolved = dayEvents.some(event =>
        event.username === username || event.attendees.includes(username)
      );
      const isToday = isCurrentMonth && day === today.getDate();

      calendarDays.push({
        day,
        isEvent,
        isUserInvolved,
        isToday,
      });
    }

    setCalendarDays(calendarDays);
  };

  const displayEvents = async (user) => {
    const mongodb = user.mongoClient("mongodb-atlas");
    const eventsCollection = mongodb.db("webProject").collection("events");
    const fetchedEvents = await eventsCollection.find({});
    setEvents(fetchedEvents);
  };

  const addEvent = async () => {
    const eventName = document.getElementById('eventName').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;

    if (!eventName || !eventDate || !eventTime) {
      alert('All fields are required');
      return;
    }

    try {
      const mongodb = loggedInUser.mongoClient("mongodb-atlas");
      const eventsCollection = mongodb.db("webProject").collection("events");
      await eventsCollection.insertOne({
        name: eventName,
        date: eventDate,
        time: eventTime,
        username: localStorage.getItem('loggedInUsername'), // Organizer's username
        attendees: selectedUsers,
      });

      // Reset form and states, fetch again and update events
      resetFormAndStates();
      await fetchAndUpdateEvents();
      // Generate calendar days for the current month
      generateCalendarDays(currentYear, currentMonth);
    } catch (error) {
      console.error("Error creating event:", error);
      alert('Failed to create the event, please try again');
    }
  };

  const updateCalendar = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const numberOfDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push({ day: null }); // Padding days
    }
    for (let day = 1; day <= numberOfDaysInMonth; day++) {
      daysArray.push({ day, isEvent: !!events.find(event => formatDate(event.date) === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`) });
    }

    setCalendarDays(daysArray);
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };
  const scrollToAllEvents = (allEventsRef) => {
    if (allEventsRef.current) {
      allEventsRef.current.scrollIntoView();
    }
  };

  const handleMonthChange = (increment) => {
    setCurrentMonth((prevMonth) => {
      let newMonth = prevMonth + increment;
      if (newMonth < 0) {
        setCurrentYear((prevYear) => prevYear - 1);
        newMonth = 11;
      } else if (newMonth > 11) {
        setCurrentYear((prevYear) => prevYear + 1);
        newMonth = 0;
      }
      return newMonth;
    });
  };

  const handleUserSelection = (userId) => {
    // Find the username corresponding to the userId
    const user = allUsers.find(user => user._id === userId);
    if (!user) return; // Exit if user not found

    setSelectedUsers(prevSelected => {
      if (prevSelected.includes(user.username)) {
        // If already selected, remove the username from the selection
        return prevSelected.filter(username => username !== user.username);
      } else {
        // Otherwise, add the username to the selection
        return [...prevSelected, user.username];
      }
    });
  };

  const handleDayClick = (day) => {
    if (day) {
      const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => formatDate(event.date) === fullDate);
      setSelectedDayEvents(dayEvents);
      setSelectedDate(fullDate);
    }
  };

  const resetFormAndStates = () => {
    // Reset form fields
    document.getElementById('eventName').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';

    // Reset component states
    setSelectedUsers([]);
    setShowAttendeesSelection(false);
    setShowSuccessModal(true); // Show a success message/modal
  };

  const fetchAndUpdateEvents = async () => {
    const mongodb = loggedInUser.mongoClient("mongodb-atlas");
    const eventsCollection = mongodb.db("webProject").collection("events");
    const fetchedEvents = await eventsCollection.find({});
    setEvents(fetchedEvents);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const eventsCollection = mongodb.db("webProject").collection("events");
      await eventsCollection.deleteOne({ _id: eventId });
      await fetchAndUpdateEvents(); // Refresh the events
    } catch (error) {
      console.error("Error deleting event:", error);
      alert('Failed to delete the event, please try again');
    }
  };

  const handleEditEvent = (eventName) => {
    localStorage.setItem('currentEventName', eventName);
    // route('/EditEvent'); // EditEvent page
  };
  
  return (
<div class="bg-gray-100 dark:bg-slate-500 font-sans">
  {/* Success Modal */}
  {showSuccessModal && (
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div class="relative top-20 mx-auto p-5 border w-96 max-w-full sm:w-80 md:w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Event Added Successfully</h3>
          <div class="mt-2">
            <p class="text-sm text-gray-500">Your event has been added to the calendar.</p>
          </div>
          <div class="mt-4">
            <button onClick={() => setShowSuccessModal(false)} class="px-4 py-2 bg-blue-500 text-white rounded-md">OK</button>
          </div>
        </div>
      </div>
    </div>
  )}

  <div class="min-h-screen dark:bg-slate-400 flex flex-col">
    {/* Header */}
    <header class="bg-white shadow-md">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center">
          <h1 class="text-2xl font-bold text-blue-600">Event Calendar</h1>
          <p class="ml-4 text-gray-600">Logged in as: {username}</p>
        </div>
        <button onClick={logout} class="px-4 py-2 bg-red-500 text-white rounded-md">Logout</button>
        <button onClick={scrollToAllEvents} class="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-md">
            All Events
          </button>
           
        </div>

    </header>

    <div class="container mx-auto px-4 py-8 flex flex-1 flex-col md:flex-row">
      {/* Create New Event window */}
      <aside class="w-full md:w-1/3 mb-8 md:mb-0 md:pr-8">
        <h2 class="text-xl font-semibold text-black mb-4">Create New Event</h2>
        <div class="bg-white  dark:bg-slate-700 p-6 rounded-md shadow-md">
          <div class="mb-4">
            <label class="block text-black font-medium mb-2" htmlFor="eventName">Event Name</label>
            <input type="text" id="eventName" class="w-full px-3 py-2 border dark:bg-slate-300 rounded-md focus:outline-none focus:ring focus:border-blue-300" />
          </div>
          <div class="mb-4">
            <label class="block text-black font-medium mb-2" htmlFor="eventDate">Event Date</label>
            <input type="date" id="eventDate" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} class="w-full px-3 py-2 border dark:bg-slate-300 rounded-md focus:outline-none focus:ring focus:border-blue-300" />
          </div>
          <div class="mb-4">
            <label class="block text-black font-medium mb-2" htmlFor="eventTime">Event Time</label>
            <input type="time" id="eventTime" class="w-full px-3 py-2 border rounded-md focus:outline-none dark:bg-slate-300 focus:ring focus:border-blue-300" />
          </div>
          <div class="mb-4">
            <button
              class="px-4 py-2 bg-gray-400 text-gray-800 rounded-md w-full"
              onClick={() => setShowAttendeesSelection(!showAttendeesSelection)}
            >
              {showAttendeesSelection ? 'Hide' : 'Add'} Attendees
            </button>
            {showAttendeesSelection && (
              <div class="mt-4">
                <ul class="space-y-2">
                  {allUsers.map((user) => (
                    <li key={user._id}>
                      <label class="flex items-center">
                        <input
                          type="checkbox"
                          value={user.username}
                          checked={selectedUsers.includes(user.username)}
                          onChange={() => handleUserSelection(user._id)}
                          class="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span class="ml-2 text-gray-700">{user.username}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button onClick={addEvent} class="px-4 py-2 bg-blue-600 text-white rounded-md w-full">Add Event</button>
        </div>
      </aside>

      {/* Main Content: Calendar */}
      <main class="flex-1">
        <div class="flex items-center justify-between mb-6">
          <button onClick={() => handleMonthChange(-1)} class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md">Previous</button>
          <h2 class="text-xl font-semibold text-gray-800">{monthNames[currentMonth]} {currentYear}</h2>
          <button onClick={() => handleMonthChange(1)} class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md">Next</button>
        </div>

        {/* Calendar */}
        <div class="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} class="text-center font-semibold text-gray-700">{day}</div>
          ))}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              class={`h-20 border rounded-md flex items-center justify-center cursor-pointer ${
                day?.isEvent ? 'bg-blue-100' : ''
              } ${day?.isUserInvolved ? 'border-blue-500' : 'border-gray-300'} ${
                day?.isToday ? 'bg-red-100 border-red-500' : ''
              }`}
              onClick={() => handleDayClick(day?.day)}
            >
              {day?.day || ''}
            </div>
          ))}
        </div>

        {/* Event Details Modal */}
        {selectedDayEvents.length > 0 && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div class="relative top-20 mx-auto p-5 border w-96 max-w-full sm:w-80 md:w-96 shadow-lg rounded-md bg-white">
              <h3 class="text-lg font-semibold mb-4">Events on {selectedDayEvents[0] && new Date(selectedDayEvents[0].date).toLocaleDateString()}</h3>
              <ul class="space-y-4">
                {selectedDayEvents.map((event) => (
                  <li key={event._id} class="bg-gray-100 p-4 rounded-md shadow">
                    <h4 class="text-md font-semibold">{event.name}</h4>
                    <p class="text-sm text-gray-600">Time: {event.time}</p>
                    <p class="text-sm text-gray-600">Attendees: {event.attendees.join(', ')}</p>
                    <div class="flex space-x-2 mt-2">
                      <button onClick={() => handleEditEvent(event.name)} class="px-3 py-1 bg-yellow-500 text-white rounded-md">Edit</button>
                      <button onClick={() => handleDeleteEvent(event._id)} class="px-3 py-1 bg-red-500 text-white rounded-md">Delete</button>
                    </div>
                  </li>
                ))} 
              </ul>
              <div class="mt-4 text-right">
                <button onClick={() => setSelectedDayEvents([])} class="px-4 py-2 bg-blue-600 text-white rounded-md">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Event List */}        
          <h2 class="text-xl font-semibold text-gray-800 mb-4">All Events</h2>
          <ul class="space-y-4">
            {events.map((event) => (
              <li key={event._id} class="bg-white p-4 rounded-md dark:bg-slate-300 shadow-md">
                <h4 class="text-md font-semibold">{event.name}</h4>
                <p class="text-sm text-gray-600">Date: {new Date(event.date).toLocaleDateString()}</p>
                <p class="text-sm text-gray-600">Time: {event.time}</p>
                <p class="text-sm text-gray-600">Attendees: {event.attendees.join(', ')}</p>
                <div class="flex space-x-2 mt-2">
                  {/* <button onClick={() => handleEditEvent(event.name)} class="px-3 py-1 bg-yellow-500 text-white rounded-md">Edit</button> */}
                  <button onClick={() => handleDeleteEvent(event._id)} class="px-3 py-1 bg-red-500 text-white rounded-md">Delete</button>
                </div>
              </li>
            ))}
          </ul>
      </main>
    </div>
  </div>
</div>
  );
};

export default EventPage;