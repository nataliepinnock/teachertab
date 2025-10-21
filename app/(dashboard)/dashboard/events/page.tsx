'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, Archive, ArrowLeft, Palette } from 'lucide-react';
import useSWR from 'swr';
import { Event } from '@/lib/db/schema';
import { EventModal } from '@/components/event-modal';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EventsPage() {
  const { data: events, error, mutate } = useSWR<Event[]>('/api/events', fetcher);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const handleAddEvent = () => {
    setModalMode('add');
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mutate();
      } else {
        console.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleEventAction = () => {
    mutate();
  };

  // Filter and sort events based on current view
  const filterAndSortEvents = () => {
    if (!events || !Array.isArray(events)) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (showArchived) {
      // Show past events, sorted by most recent first
      return events
        .filter(event => new Date(event.startTime) < today)
        .sort((a, b) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });
    } else {
      // Show current and future events, sorted by soonest first
      return events
        .filter(event => new Date(event.startTime) >= today)
        .sort((a, b) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateA.getTime() - dateB.getTime(); // Soonest first
        });
    }
  };

  const sortedEvents = filterAndSortEvents();
  const pastEventsCount = events && Array.isArray(events) ? events.filter(event => new Date(event.startTime) < new Date()).length : 0;
  const currentEventsCount = events && Array.isArray(events) ? events.filter(event => new Date(event.startTime) >= new Date()).length : 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short', 
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (date: string) => {
    const today = new Date();
    const eventDate = new Date(date);
    return today.toDateString() === eventDate.toDateString();
  };

  const isPast = (date: string) => {
    const today = new Date();
    const eventDate = new Date(date);
    return eventDate < today;
  };

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Events</h1>
        <p className="text-red-600">Failed to load events</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {showArchived ? 'Archived Events' : 'Events'}
          </h1>
          <p className="text-gray-600 mt-1">
            {showArchived 
              ? `${pastEventsCount} past event${pastEventsCount !== 1 ? 's' : ''}`
              : `${currentEventsCount} upcoming event${currentEventsCount !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {showArchived ? (
            <Button 
              variant="outline" 
              onClick={() => setShowArchived(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Current</span>
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowArchived(true)}
                className="flex items-center space-x-2"
              >
                <Archive className="h-4 w-4" />
                <span>View Archive ({pastEventsCount})</span>
              </Button>
              <Button onClick={handleAddEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </>
          )}
        </div>
      </div>

      <EventModal
        isOpen={showModal}
        onClose={handleModalClose}
        onEventAdded={handleEventAction}
        event={selectedEvent}
        mode={modalMode}
      />

      {!sortedEvents || sortedEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showArchived ? 'No archived events' : 'No events yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {showArchived 
                  ? 'No past events found in the archive.'
                  : 'Create your first event to get started with event planning.'
                }
              </p>
              {!showArchived && (
                <Button onClick={handleAddEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                                     <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                     Event
                   </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEvents.map((event) => {
                  const isAllDay = event.allDay === 1;
                  const isEventToday = isToday(event.startTime.toString());
                  const isEventPast = isPast(event.startTime.toString());
                  
                  return (
                    <tr 
                      key={event.id} 
                      className={`hover:bg-gray-50 ${
                        isEventPast ? 'opacity-75' : ''
                      }`}
                    >
                                             <td className="px-3 py-4 whitespace-nowrap">
                         <div>
                           <div className="flex items-center space-x-2 mb-1">
                             <h3 className="text-sm font-medium text-gray-900">
                               {event.title}
                             </h3>
                             {isEventToday && !showArchived && (
                               <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                 Today
                               </span>
                             )}
                             {isEventPast && !showArchived && (
                               <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                 Past
                               </span>
                             )}
                             {showArchived && (
                               <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                 Past
                               </span>
                             )}
                           </div>
                           {event.description && (
                             <p className="text-xs text-gray-500 max-w-xs truncate">
                               {event.description}
                             </p>
                           )}
                         </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(event.startTime.toString())}</span>
                        </div>
                        {!isAllDay && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {formatTime(event.startTime.toString())} - {formatTime(event.endTime.toString())}
                            </span>
                          </div>
                        )}
                        {isAllDay && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              All Day
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.color ? (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: event.color }}
                            />
                            <span className="text-xs text-gray-600 font-medium">Color assigned</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No color</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.location ? (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="max-w-xs truncate">{event.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No location</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isEventPast 
                            ? 'bg-gray-100 text-gray-800' 
                            : isEventToday 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isEventPast ? 'Past' : isEventToday ? 'Today' : 'Upcoming'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                            className="h-8 w-8 p-0"
                            title="Edit Event"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 