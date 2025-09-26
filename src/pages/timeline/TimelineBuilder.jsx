import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const BASE_URL = "https://tendr-backend-75ag.onrender.com";

export default function TimelineBuilder() {
  const [events, setEvents] = useState([]);
  const [timelineId, setTimelineId] = useState(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch timelines from backend on mount
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/api/timelines`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        // Use first timeline for now
        if (res.data && res.data.length > 0) {
          setEvents(res.data[0].items || []);
          setTimelineId(res.data[0]._id);
        }
      })
      .catch((err) => console.error("Fetch timelines error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Drag and drop reorder
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(events);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setEvents(items);
    // Update backend
    if (timelineId) {
      try {
        await axios.put(
          `${BASE_URL}/api/timelines/${timelineId}`,
          { items },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
      } catch (err) {
        console.error("Reorder error:", err);
      }
    }
  };

  // Add new event
  const addEvent = async () => {
    const newEvent = {
      id: Date.now().toString(),
      title: "",
      description: "",
      checked: false,
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    // Update backend
    if (timelineId) {
      try {
        await axios.put(
          `${BASE_URL}/api/timelines/${timelineId}`,
          { items: updatedEvents },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
      } catch (err) {
        console.error("Add event error:", err);
      }
    }
  };

  // Update field
  const updateEvent = async (id, field, value) => {
    const updatedEvents = events.map((e) => (e.id === id ? { ...e, [field]: value } : e));
    setEvents(updatedEvents);
    // Update backend
    if (timelineId) {
      try {
        await axios.put(
          `${BASE_URL}/api/timelines/${timelineId}`,
          { items: updatedEvents },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
      } catch (err) {
        console.error("Update event error:", err);
      }
    }
  };

  // Toggle checkbox
  const toggleCheckbox = async (id) => {
    const updatedEvents = events.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e));
    setEvents(updatedEvents);
    // Update backend
    if (timelineId) {
      try {
        await axios.put(
          `${BASE_URL}/api/timelines/${timelineId}`,
          { items: updatedEvents },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
      } catch (err) {
        console.error("Toggle checkbox error:", err);
      }
    }
  };

  return (
    <div className="p-6 min-h-screen mx-auto bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Custom Timeline Builder</h1>
        <button
          onClick={() => setPreview(!preview)}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white"
        >
          {preview ? "Edit Mode" : "Preview Mode"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading timeline...</div>
      ) : preview ? (
        // -------------------- Preview Mode --------------------
        <div className="relative">
          {/* vertical line in the center */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-300 -translate-x-1/2"></div>

          <div className="space-y-12">
            {events.map((event, index) => {
              const isLeft = index % 2 === 0; // alternate left/right
              return (
                <div
                  key={event.id}
                  className={`relative flex w-full ${
                    isLeft ? "justify-start pr-1/2" : "justify-end pl-1/2"
                  }`}
                >
                  {/* dot on the timeline */}
                  <div className="absolute left-1/2 top-4 w-4 h-4 rounded-full border-2 border-blue-500 bg-white -translate-x-1/2"></div>

                  {/* card */}
                  <div
                    className={`w-5/12 p-4 rounded-lg shadow bg-white ${
                      event.checked ? "opacity-60 line-through" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={event.checked}
                        onChange={() => toggleCheckbox(event.id)}
                        className="mt-1"
                      />
                      <div>
                        <h2 className="text-lg font-semibold">
                          {event.title || "Untitled"}
                        </h2>
                        <p className="text-gray-600">{event.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // -------------------- Edit Mode --------------------
        <div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="timeline">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {events.map((event, index) => (
                    <Draggable key={event.id} draggableId={event.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-4 border rounded-lg shadow bg-gray-50"
                        >
                          <input
                            type="text"
                            placeholder="Title"
                            value={event.title}
                            onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                            className="w-full p-2 mb-2 border rounded"
                          />
                          <textarea
                            placeholder="Description"
                            value={event.description}
                            onChange={(e) => updateEvent(event.id, "description", e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <button
            onClick={addEvent}
            className="mt-4 px-4 py-2 rounded-lg bg-green-500 text-white"
          >
            Add Event
          </button>
        </div>
      )}
    </div>
  );
}
