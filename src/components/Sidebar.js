'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const STORAGE_KEY = 'voice-notes-todos';

const Sidebar = forwardRef((props, ref) => {
  const [todos, setTodos] = useState(() => {
    // Initialize state from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedTodos = localStorage.getItem(STORAGE_KEY);
        if (savedTodos) {
          const parsedTodos = JSON.parse(savedTodos);
          if (Array.isArray(parsedTodos)) {
            return parsedTodos;
          }
        }
      } catch (error) {
        console.error('Error loading todos from localStorage:', error);
      }
    }
    return [];
  });

  const [newTodoText, setNewTodoText] = useState('');
  const [completedPercentage, setCompletedPercentage] = useState(0);

  // Calculate completion percentage whenever todos change
  useEffect(() => {
    if (todos.length === 0) {
      setCompletedPercentage(0);
      return;
    }
    const completed = todos.filter(todo => todo.completed).length;
    const percentage = Math.round((completed / todos.length) * 100);
    setCompletedPercentage(percentage);
  }, [todos]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch (error) {
        console.error('Error saving todos to localStorage:', error);
        // If storage is full, try to remove old todos
        if (error.name === 'QuotaExceededError') {
          const reducedTodos = todos.slice(-50); // Keep only the last 50 todos
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedTodos));
            setTodos(reducedTodos);
          } catch (retryError) {
            console.error('Failed to save reduced todos:', retryError);
          }
        }
      }
    }
  }, [todos]);

  const addTodo = (text, date = new Date()) => {
    if (!text.trim()) return;
    
    console.log('Adding todo in Sidebar:', text);
    const newTodo = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      completed: false,
      createdAt: date.toISOString(),
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
    console.log('New todo object:', newTodo);
    setTodos(prevTodos => {
      const updatedTodos = [...prevTodos, newTodo];
      console.log('Updated todos:', updatedTodos);
      return updatedTodos;
    });
  };

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      addTodo(newTodoText);
      setNewTodoText('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(prevTodos => 
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  const clearCompletedTodos = () => {
    setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
  };

  const clearAllTodos = () => {
    if (window.confirm('Are you sure you want to delete all todos?')) {
      setTodos([]);
    }
  };

  // Group todos by date
  const groupedTodos = todos.reduce((groups, todo) => {
    const date = todo.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(todo);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTodos).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    addTodo,
    clearCompletedTodos,
    clearAllTodos
  }), []);

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <h2>Todo List</h2>
        
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${completedPercentage}%` }}
            />
          </div>
          <div className="progress-text">
            {completedPercentage}% Complete
          </div>
        </div>

        <div className="todo-actions">
          <button 
            onClick={clearCompletedTodos}
            className="todo-action-button"
          >
            Clear Completed
          </button>
          <button 
            onClick={clearAllTodos}
            className="todo-action-button"
          >
            Clear All
          </button>
        </div>

        <div className="todo-list">
          {sortedDates.map(date => (
            <div key={date} className="todo-group">
              <h3 className="todo-date">{date}</h3>
              {groupedTodos[date].map(todo => (
                <div 
                  key={todo.id} 
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span className="todo-text">{todo.text}</span>
                  <button 
                    onClick={() => deleteTodo(todo.id)}
                    className="delete-todo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddTodo} className="todo-input-form">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Add new todo..."
            className="todo-input"
          />
          <button type="submit" className="todo-input-button">
            Add
          </button>
        </form>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar; 