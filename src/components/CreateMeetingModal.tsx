import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Video } from 'lucide-react';
import { Meeting, Student } from '../types';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (meeting: Partial<Meeting>) => void;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    recordingEnabled: true,
  });

  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  // Sample students data
  const availableStudents: Student[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
    { id: '3', name: 'Carol Davis', email: 'carol@example.com' },
    { id: '4', name: 'David Wilson', email: 'david@example.com' },
    { id: '5', name: 'Eva Brown', email: 'eva@example.com' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduledTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    
    onCreate({
      ...formData,
      scheduledTime,
      students: selectedStudents,
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 60,
      recordingEnabled: true,
    });
    setSelectedStudents([]);
  };

  const toggleStudent = (student: Student) => {
    setSelectedStudents(prev => 
      prev.find(s => s.id === student.id)
        ? prev.filter(s => s.id !== student.id)
        : [...prev, student]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Meeting</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meeting title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Meeting description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Time *
              </label>
              <input
                type="time"
                required
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Users className="h-4 w-4 inline mr-1" />
              Invite Students
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-700 rounded-lg p-3">
              {availableStudents.map((student) => (
                <label key={student.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-600 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedStudents.some(s => s.id === student.id)}
                    onChange={() => toggleStudent(student)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">{student.name}</div>
                    <div className="text-gray-400 text-sm">{student.email}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedStudents.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                {selectedStudents.length} student(s) selected
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="recording"
              checked={formData.recordingEnabled}
              onChange={(e) => setFormData({ ...formData, recordingEnabled: e.target.checked })}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <label htmlFor="recording" className="flex items-center text-gray-300 cursor-pointer">
              <Video className="h-4 w-4 mr-2" />
              Enable recording for this meeting
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;