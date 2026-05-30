import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaClipboardList, FaCheckCircle, FaTimesCircle, FaClock, 
  FaPlus, FaEye, FaComment, FaPaperclip, FaBell, FaRobot,
  FaChartLine, FaUserCheck, FaCalendarAlt, FaFilter,
  FaGripHorizontal, FaArrowRight, FaSpinner, FaExclamationTriangle
} from 'react-icons/fa';

const Workflows = ({ user, darkMode }) => {
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [formData, setFormData] = useState({
    type: 'PTW',
    title: '',
    description: '',
    priority: 'Medium',
    department: '',
    location: '',
    dueDate: ''
  });
  
  const API_BASE = 'http://localhost:5000';
  const userId = user?.userId || 'user123';
  const userName = user?.name || 'Current User';
  
  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/workflows?status=${filterStatus}&type=${filterType}`);
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || []);
      }
    } catch (err) {
      console.error('Gagal fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);
  
  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  };
  
  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows/notifications/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Gagal fetch notifications:', err);
    }
  };
  
  // Get AI suggestion
  const getAISuggestion = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows/ai-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          priority: formData.priority,
          department: formData.department,
          history: []
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data);
      }
    } catch (err) {
      console.error('Gagal get AI suggestion:', err);
    }
  };
  
  // Create workflow
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: userId,
          createdByName: userName,
          assignedTo: aiSuggestion?.recommendedAssignee === 'Supervisor' ? 'supervisor1' : 'hse1',
          assignedToName: aiSuggestion?.recommendedAssignee || 'Supervisor'
        })
      });
      if (res.ok) {
        await fetchWorkflows();
        await fetchStats();
        setShowForm(false);
        setFormData({ type: 'PTW', title: '', description: '', priority: 'Medium', department: '', location: '', dueDate: '' });
        setAiSuggestion(null);
      }
    } catch (err) {
      console.error('Gagal create workflow:', err);
    }
  };
  
  // Update step status
  const updateStepStatus = async (workflowId, stepId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows/${workflowId}/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: `Step ${status} by ${userName}` })
      });
      if (res.ok) {
        await fetchWorkflows();
        await fetchStats();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Gagal update step:', err);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_BASE}/api/workflows/notifications/${notificationId}/read`, { method: 'PUT' });
      await fetchNotifications();
    } catch (err) {
      console.error('Gagal mark as read:', err);
    }
  };
  
  useEffect(() => {
    fetchWorkflows();
    fetchStats();
    fetchNotifications();
    
    // Polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchWorkflows]);
  
  // Kanban columns
  const kanbanColumns = {
    'Pending': workflows.filter(w => ['Draft', 'Pending', 'In Review'].includes(w.status)),
    'In Progress': workflows.filter(w => w.status === 'In Review' || (w.currentStep > 0 && w.currentStep < w.steps?.length - 1)),
    'Approved': workflows.filter(w => w.status === 'Approved'),
    'Completed': workflows.filter(w => w.status === 'Completed'),
    'Rejected': workflows.filter(w => w.status === 'Rejected')
  };
  
  const getPriorityColor = (priority) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    return colors[priority] || colors.Medium;
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <FaCheckCircle className="text-green-500" />;
      case 'Rejected': return <FaTimesCircle className="text-red-500" />;
      case 'Completed': return <FaCheckCircle className="text-blue-500" />;
      default: return <FaClock className="text-yellow-500" />;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50/30'
    }`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              ⚙️ Workflow Dashboard
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage approvals, PTW, incidents and compliance workflows
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition"
            >
              <FaBell className="text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setShowForm(true); getAISuggestion(); }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <FaPlus /> New Workflow
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
              <p className="text-xs text-gray-500">Total Workflows</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <p className="text-2xl font-bold text-green-600">{stats.approved + stats.completed}</p>
              <p className="text-xs text-gray-500">Approved/Completed</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <p className="text-2xl font-bold text-purple-600">{stats.byType?.PTW || 0}</p>
              <p className="text-xs text-gray-500">Active PTW</p>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
          >
            <option value="all">All Types</option>
            <option value="PTW">PTW Permit</option>
            <option value="Incident">Incident Report</option>
            <option value="Compliance">Compliance</option>
            <option value="Training">Training</option>
            <option value="APD">APD Request</option>
          </select>
          <button
            onClick={() => { setFilterStatus('all'); setFilterType('all'); }}
            className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition"
          >
            Reset
          </button>
        </div>
        
        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {Object.entries(kanbanColumns).map(([columnName, columnWorkflows]) => (
              <div key={columnName} className="w-80 flex-shrink-0">
                <div className={`rounded-xl p-3 mb-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                      {getStatusIcon(columnName)}
                      {columnName}
                    </h3>
                    <span className="text-sm text-gray-500">{columnWorkflows.length}</span>
                  </div>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  <AnimatePresence>
                    {columnWorkflows.map((workflow) => (
                      <motion.div
                        key={workflow.workflowId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md ${
                          darkMode ? 'bg-gray-800/60 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-gray-500">{workflow.workflowId}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(workflow.priority)}`}>
                            {workflow.priority}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{workflow.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">{workflow.type} • {workflow.location || 'N/A'}</p>
                        
                        {/* Progress bar */}
                        {workflow.steps && workflow.steps.length > 0 && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{Math.round((workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${(workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FaUserCheck /> {workflow.assignedToName || 'Unassigned'}
                          </div>
                          <div className="flex gap-2">
                            {workflow.comments?.length > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <FaComment /> {workflow.comments.length}
                              </span>
                            )}
                            {workflow.attachments?.length > 0 && (
                              <span className="text-xs text-gray-400">
                                <FaPaperclip />
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Workflow Detail Modal */}
      <AnimatePresence>
        {selectedWorkflow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedWorkflow(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {selectedWorkflow.title}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedWorkflow.workflowId} • {selectedWorkflow.type}</p>
                </div>
                <button onClick={() => setSelectedWorkflow(null)} className="text-gray-400 hover:text-gray-600">
                  <FaTimesCircle />
                </button>
              </div>
              
              {/* Workflow Steps */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Workflow Steps</h3>
                <div className="space-y-3">
                  {selectedWorkflow.steps?.map((step, idx) => (
                    <div key={step.stepId} className={`p-3 rounded-lg border ${
                      step.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                      step.status === 'in_progress' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            step.status === 'completed' ? 'bg-green-500 text-white' :
                            step.status === 'in_progress' ? 'bg-yellow-500 text-white' :
                            'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{step.name}</p>
                            {step.assignedToName && (
                              <p className="text-xs text-gray-500">Assigned to: {step.assignedToName}</p>
                            )}
                          </div>
                        </div>
                        {step.status === 'in_progress' && (
                          <button
                            onClick={() => updateStepStatus(selectedWorkflow.workflowId, step.stepId, 'completed')}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm"
                          >
                            Complete
                          </button>
                        )}
                        {step.status === 'pending' && idx === selectedWorkflow.currentStep && (
                          <button
                            onClick={() => updateStepStatus(selectedWorkflow.workflowId, step.stepId, 'in_progress')}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Comments */}
              {selectedWorkflow.comments?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Comments</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedWorkflow.comments.map((comment, idx) => (
                      <div key={idx} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm"><strong>{comment.userName}</strong>: {comment.comment}</p>
                        <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`fixed right-0 top-0 bottom-0 w-96 z-50 shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400">
                <FaTimesCircle />
              </button>
            </div>
            <div className="overflow-y-auto h-full pb-20">
              {notifications.map(notif => (
                <div 
                  key={notif._id} 
                  className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => { markAsRead(notif._id); if (notif.actionUrl) window.location.href = notif.actionUrl; }}
                >
                  <p className="font-semibold text-sm">{notif.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Create Workflow Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Create New Workflow
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimesCircle />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  value={formData.type}
                  onChange={(e) => { setFormData({...formData, type: e.target.value}); getAISuggestion(); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="PTW">Permit to Work (PTW)</option>
                  <option value="Incident">Incident Report</option>
                  <option value="Compliance">Compliance Review</option>
                  <option value="Training">Training Request</option>
                  <option value="APD">APD Request</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
                
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  rows="3"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Priority</option>
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
                
                <input
                  type="date"
                  placeholder="Due Date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
                
                {/* AI Suggestion */}
                {aiSuggestion && (
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaRobot className="text-indigo-600" />
                      <span className="font-semibold text-indigo-800 dark:text-indigo-300">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Recommended for: {aiSuggestion.recommendedAssignee}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      Est. completion: {aiSuggestion.estimatedCompletion}
                    </p>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition"
                >
                  Create Workflow
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workflows;